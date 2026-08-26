import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Vendor } from "../models/Vendor.js";
import { User } from "../models/User.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { OrderStatus, ProductStatus } from "../config/constants.js";
import { env } from "../config/env.js";
import { initializeTransaction, verifyTransaction } from "../config/paystack.js";
import { geocodeAddress, distanceKm, calculateShippingFee } from "../config/geocoding.js";
import { type CheckoutInput } from "../validators/checkoutValidators.js";

// Shared by checkout() and previewCheckout(): validates cart items,
// prices everything server-side, groups by vendor, and computes a real
// distance-based shipping fee per vendor using the buyer's geocoded
// address — never a flat guessed number.
async function buildSubOrders(
    items: CheckoutInput["items"],
    shippingAddress: CheckoutInput["shippingAddress"]
) {
    const buyerFullAddress = `${shippingAddress.line1}, ${shippingAddress.city}, ${shippingAddress.state}`;
    const buyerCoords = await geocodeAddress(buyerFullAddress);
    if (!buyerCoords) {
        throw new AppError("Could not locate your shipping address. Please check it and try again.", 400);
    }

    const subOrdersByVendor = new Map<
        string,
        { items: { product: string; sku?: string; title: string; price: number; quantity: number }[]; subtotal: number }
    >();

    for (const cartItem of items) {
        const product = await Product.findById(cartItem.productId);
        if (!product) {
        throw new AppError(`Product ${cartItem.productId} not found`, 404);
        }
        if (product.status !== ProductStatus.APPROVED) {
        throw new AppError(`"${product.title}" is not currently available`, 400);
        }

        let price: number;
        let availableStock: number;

        if (product.hasVariants) {
        const variant = product.variants.find((v) => v.sku === cartItem.sku);
        if (!variant) {
            throw new AppError(`Selected variant not found for "${product.title}"`, 400);
        }
        price = variant.price;
        availableStock = variant.stock;
        } else {
        price = product.basePrice;
        availableStock = product.totalStock;
        }

        if (availableStock < cartItem.quantity) {
        throw new AppError(`Not enough stock for "${product.title}"`, 400);
        }

        const vendorId = product.vendor.toString();
        const existing = subOrdersByVendor.get(vendorId) ?? { items: [], subtotal: 0 };
        existing.items.push({
        product: product.id,
        sku: cartItem.sku,
        title: product.title,
        price,
        quantity: cartItem.quantity,
        });
        existing.subtotal += price * cartItem.quantity;
        subOrdersByVendor.set(vendorId, existing);
    }

    // Build subOrders with payout math and real, distance-based shipping.
    const subOrders = [];
    for (const [vendorId, data] of subOrdersByVendor) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
        throw new AppError("Vendor not found for one or more items", 404);
        }

        let shippingFee = 0;
        if (vendor.location?.lat && vendor.location?.lng) {
        const km = distanceKm(
            { lat: vendor.location.lat, lng: vendor.location.lng },
            buyerCoords
        );
        shippingFee = calculateShippingFee(km);
        }
        // If a vendor never set a store address (older accounts, before
        // this feature existed), shipping falls back to 0 rather than
        // blocking checkout entirely — better to under-charge than to
        // break orders for existing sellers.

        const commission = (data.subtotal * vendor.commissionRate) / 100;
        subOrders.push({
        vendor: vendor._id,
        vendorName: vendor.storeName,
        items: data.items,
        subtotal: data.subtotal,
        shippingFee,
        status: OrderStatus.PLACED,
        payout: {
            amount: data.subtotal - commission,
            commission,
            status: "held" as const,
        },
        });
    }

    return subOrders;
}

// Lets the frontend show real shipping costs before the buyer commits to
// paying — same calculation checkout() uses, but doesn't create an order
// or charge anything.
export async function previewCheckout(
    req: Request<{}, {}, CheckoutInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const subOrders = await buildSubOrders(req.body.items, req.body.shippingAddress);
        const subtotal = subOrders.reduce((sum, s) => sum + s.subtotal, 0);
        const totalShipping = subOrders.reduce((sum, s) => sum + s.shippingFee, 0);

        return ok(res, {
        vendors: subOrders.map((s) => ({
            vendorName: s.vendorName,
            subtotal: s.subtotal,
            shippingFee: s.shippingFee,
        })),
        subtotal,
        totalShipping,
        total: subtotal + totalShipping,
        });
    } catch (err) {
        next(err);
    }
}

// Builds the order from the cart, splits it per-vendor into subOrders,
// prices everything server-side (never trust prices sent from the
// frontend), and kicks off a Paystack transaction for the total.
export async function checkout(
    req: Request<{}, {}, CheckoutInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const { items, shippingAddress } = req.body;
        const buyer = await User.findById(req.user!.userId);
        if (!buyer) {
        throw new AppError("User not found", 404);
        }

        const subOrders = await buildSubOrders(items, shippingAddress);
        // vendorName was only needed for the preview response — strip it
        // before saving, since it's not part of the Order schema.
        const subOrdersForDb = subOrders.map(({ vendorName: _unused, ...rest }) => rest);

        const totalAmount = subOrdersForDb.reduce((sum, s) => sum + s.subtotal + s.shippingFee, 0);
        const reference = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

        const order = await Order.create({
        orderNumber,
        buyer: buyer._id,
        subOrders: subOrdersForDb,
        totalAmount,
        shippingAddress,
        paymentReference: reference,
        paymentStatus: "pending",
        });

        const { authorizationUrl } = await initializeTransaction(
        buyer.email,
        totalAmount,
        reference,
        `${env.FRONTEND_URL}/checkout/callback`
        );

        return ok(res, { order, authorizationUrl }, 201);
    } catch (err) {
        next(err);
    }
}

// Shared by both the redirect-verify flow and the webhook: marks an order
// paid and decrements stock. Safe to call twice — already-paid orders are
// a no-op, so a webhook firing after the user already verified manually
// (or vice versa) never double-decrements stock.
async function finalizeOrderPayment(order: InstanceType<typeof Order>) {
    if (order.paymentStatus === "paid") return order;

    order.paymentStatus = "paid";
    await order.save();

    for (const subOrder of order.subOrders) {
        for (const item of subOrder.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;

        if (product.hasVariants && item.sku) {
            const variant = product.variants.find((v) => v.sku === item.sku);
            if (variant) variant.stock = Math.max(0, variant.stock - item.quantity);
            product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        } else {
            product.totalStock = Math.max(0, product.totalStock - item.quantity);
        }
        await product.save();
        }
    }

    return order;
}

// Called by the frontend after Paystack redirects back with a reference.
// Confirms payment with Paystack directly (never trusts the redirect
// alone), then marks the order paid and decrements stock.
export async function verifyPayment(req: Request<{ reference: string }>, res: Response, next: NextFunction) {
    try {
        const { reference } = req.params;
        const order = await Order.findOne({ paymentReference: reference });
        if (!order) {
        throw new AppError("Order not found", 404);
        }

        // Already processed — don't double-decrement stock on refresh/retry.
        if (order.paymentStatus === "paid") {
        return ok(res, order);
        }

        const result = await verifyTransaction(reference);

        if (result.status !== "success") {
        order.paymentStatus = "failed";
        await order.save();
        throw new AppError("Payment was not successful", 400);
        }

        // Sanity check: paid amount must match what we charged for.
        const expectedKobo = Math.round(order.totalAmount * 100);
        if (result.amountKobo !== expectedKobo) {
        order.paymentStatus = "failed";
        await order.save();
        throw new AppError("Payment amount mismatch", 400);
        }

        // Paid and stock decrement both happen in finalizeOrderPayment,
        // shared with the webhook handler below.
        await finalizeOrderPayment(order);

        return ok(res, order);
    } catch (err) {
        next(err);
    }
}

// Paystack calls this server-to-server whenever a transaction completes —
// more reliable than the redirect flow above, since it fires even if the
// buyer closes the tab before being redirected back. The signature check
// proves the request genuinely came from Paystack, not a spoofed call.
export async function paystackWebhook(req: Request, res: Response) {
    try {
        const signature = req.headers["x-paystack-signature"] as string | undefined;
        const rawBody = req.body as Buffer;

        if (!signature || !rawBody) {
        return res.status(400).end();
        }

        const expectedSignature = crypto
        .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
        .update(rawBody)
        .digest("hex");

        if (expectedSignature !== signature) {
        // Not actually from Paystack — ignore silently, don't leak info.
        return res.status(401).end();
        }

        const event = JSON.parse(rawBody.toString("utf8"));

        if (event.event === "charge.success") {
        const reference = event.data.reference as string;
        const order = await Order.findOne({ paymentReference: reference });

        if (order && order.paymentStatus !== "paid") {
            const expectedKobo = Math.round(order.totalAmount * 100);
            if (event.data.amount === expectedKobo) {
            await finalizeOrderPayment(order);
            }
        }
        }

        // Always 200 quickly so Paystack doesn't retry unnecessarily.
        return res.status(200).end();
    } catch {
        // Swallow errors here — a 500 would make Paystack retry
        // indefinitely on a request we can't process anyway.
        return res.status(200).end();
    }
}