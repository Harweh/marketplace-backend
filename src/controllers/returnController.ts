import { type Request, type Response, type NextFunction } from "express";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Vendor } from "../models/Vendor.js";
import { User } from "../models/User.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { OrderStatus } from "../config/constants.js";
import { refundTransaction } from "../config/paystack.js";
import { notify } from "../utils/notify.js";
import {
    returnRequestedSellerEmail,
    returnApprovedEmail,
    returnRejectedEmail,
} from "../utils/emailTemplates.js";
import { type RequestReturnInput, type ResolveReturnInput } from "../validators/returnValidators.js";

// A buyer requests a return on their own delivered sub-order. Every item
// in that sub-order must individually be returnable and still inside its
// own product's return window — one non-eligible item blocks the whole
// request, with a clear message naming it.
export async function requestReturn(
    req: Request<{ orderId: string; subOrderId: string }, {}, RequestReturnInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) throw new AppError("Order not found", 404);
        if (!order.buyer.equals(req.user!.userId)) {
        throw new AppError("You can only request a return on your own orders", 403);
        }

        const subOrder = order.subOrders.find(
        (s) => (s as unknown as { _id: { toString(): string } })._id.toString() === req.params.subOrderId
        );
        if (!subOrder) throw new AppError("Sub-order not found", 404);

        if (subOrder.status !== OrderStatus.DELIVERED) {
        throw new AppError("Only delivered orders can be returned", 400);
        }
        if (subOrder.returnStatus && subOrder.returnStatus !== "none") {
        throw new AppError("A return has already been requested for this order", 409);
        }
        if (!subOrder.deliveredAt) {
        throw new AppError("This order has no delivery date on record", 400);
        }

        // Check every item against its own product's return policy.
        for (const item of subOrder.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;

        if (!product.isReturnable) {
            throw new AppError(`"${product.title}" is not eligible for return`, 400);
        }

        const deadline = new Date(subOrder.deliveredAt);
        deadline.setDate(deadline.getDate() + product.returnWindowDays);
        if (new Date() > deadline) {
            throw new AppError(`The return window for "${product.title}" has expired`, 400);
        }
        }

        subOrder.returnStatus = "requested";
        subOrder.returnReason = req.body.reason;
        subOrder.returnPhotos = req.body.photos;
        subOrder.returnRequestedAt = new Date();
        subOrder.status = OrderStatus.RETURN_REQUESTED;

        await order.save();

        // Notify the seller — an admin resolves it, but the seller should
        // know a return is coming.
        const vendor = await Vendor.findById(subOrder.vendor);
        if (vendor) {
        const owner = await User.findById(vendor.user);
        if (owner) {
            const { subject, html } = returnRequestedSellerEmail(vendor.storeName, order.orderNumber, req.body.reason);
            await notify({
            userId: owner._id.toString(), email: owner.email,
            type: "return_requested", title: "Return Requested",
            message: `A return was requested for order #${order.orderNumber}.`,
            link: "/sell/orders",
            emailSubject: subject, emailHtml: html,
            });
        }
        }

        return ok(res, order);
    } catch (err) {
        next(err);
    }
}

// Admin/support resolves a pending return — approve triggers an actual
// Paystack refund; reject just reverts the order back to delivered.
export async function resolveReturn(
    req: Request<{ orderId: string; subOrderId: string }, {}, ResolveReturnInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) throw new AppError("Order not found", 404);

        const subOrder = order.subOrders.find(
        (s) => (s as unknown as { _id: { toString(): string } })._id.toString() === req.params.subOrderId
        );
        if (!subOrder) throw new AppError("Sub-order not found", 404);
        if (subOrder.returnStatus !== "requested") {
        throw new AppError("This sub-order has no pending return request", 400);
        }

        const buyer = await User.findById(order.buyer);
        const { approve, adminNote } = req.body;

        if (approve) {
        await refundTransaction(order.paymentReference);
        subOrder.returnStatus = "approved";
        subOrder.status = OrderStatus.REFUNDED;
        subOrder.payout.status = "failed"; // seller doesn't get paid out for a refunded order
        if (buyer) {
            const { subject, html } = returnApprovedEmail(buyer.name, order.orderNumber);
            await notify({
            userId: buyer._id.toString(), email: buyer.email,
            type: "return_approved", title: "Return Approved",
            message: `Your return for order #${order.orderNumber} was approved.`,
            link: "/account?tab=orders",
            emailSubject: subject, emailHtml: html,
            });
        }
        } else {
        subOrder.returnStatus = "rejected";
        subOrder.status = OrderStatus.DELIVERED; // reverts — buyer keeps the item
        if (buyer) {
            const { subject, html } = returnRejectedEmail(buyer.name, order.orderNumber, adminNote);
            await notify({
            userId: buyer._id.toString(), email: buyer.email,
            type: "return_rejected", title: "Return Request Update",
            message: `Your return for order #${order.orderNumber} was not approved.`,
            link: "/account?tab=orders",
            emailSubject: subject, emailHtml: html,
            });
        }
        }

        subOrder.returnResolvedAt = new Date();
        await order.save();

        return ok(res, order);
    } catch (err) {
        next(err);
    }
}

// Admin-only: every order with at least one sub-order currently pending
// a return decision.
export async function listPendingReturns(_req: Request, res: Response, next: NextFunction) {
    try {
        const orders = await Order.find({ "subOrders.returnStatus": "requested" })
        .populate("buyer", "name email")
        .populate("subOrders.vendor", "storeName")
        .sort({ createdAt: -1 });

        return ok(res, orders);
    } catch (err) {
        next(err);
    }
}