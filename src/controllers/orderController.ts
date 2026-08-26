import { type Request, type Response, type NextFunction } from "express";
import { Order } from "../models/Order.js";
import { Vendor } from "../models/Vendor.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { OrderStatus } from "../config/constants.js";
import { type UpdateOrderStatusInput } from "../validators/orderValidators.js";

// Admin-only: every order in the system, newest first.
// Supports ?status= to filter by a sub-order status (e.g. "placed").
export async function listAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
        const { status, page = "1", limit = "20" } = req.query;

        const filter: Record<string, unknown> = {};
        if (status) filter["subOrders.status"] = status;

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));

        const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate("buyer", "name email phone")
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .sort({ createdAt: -1 }),
        Order.countDocuments(filter),
        ]);

        return ok(res, { orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    } catch (err) {
        next(err);
    }
}

// Admin-only: a single order's full detail.
export async function getOrderById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const order = await Order.findById(req.params.id)
        .populate("buyer", "name email phone")
        .populate("subOrders.vendor", "storeName storeSlug");

        if (!order) {
        throw new AppError("Order not found", 404);
        }

        return ok(res, order);
    } catch (err) {
        next(err);
    }
}

// Admin-only: change a specific sub-order's status. Covers cancelling an
// order, marking it shipped/delivered, and processing returns/refunds —
// orders are never hard-deleted, only moved through this status lifecycle
// so financial/audit history stays intact.
export async function updateOrderStatus(
    req: Request<{ id: string; subOrderId: string }, {}, UpdateOrderStatusInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
        throw new AppError("Order not found", 404);
        }

        const subOrder = order.subOrders.find(
        (s) => (s as unknown as { _id: { toString(): string } })._id.toString() === req.params.subOrderId
        );
        if (!subOrder) {
        throw new AppError("Sub-order not found", 404);
        }

        const { status, trackingNumber } = req.body;

        subOrder.status = status as OrderStatus;
        if (trackingNumber) subOrder.trackingNumber = trackingNumber;
        if (status === OrderStatus.SHIPPED) subOrder.shippedAt = new Date();
        if (status === OrderStatus.DELIVERED) subOrder.deliveredAt = new Date();
        if (status === OrderStatus.REFUNDED) subOrder.payout.status = "failed";

        await order.save();
        return ok(res, order);
    } catch (err) {
        next(err);
    }
}

// Admin-only: sales totals for today, this week, this month, and all-time.
// Only counts orders that were actually paid — pending/failed payments
// aren't real revenue yet.
export async function getSalesStats(_req: Request, res: Response, next: NextFunction) {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay()); // Sunday start
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const paidFilter = { paymentStatus: "paid" as const };

        const [today, week, month, allTime] = await Promise.all([
        Order.aggregate([
            { $match: { ...paidFilter, createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
            { $match: { ...paidFilter, createdAt: { $gte: startOfWeek } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
            { $match: { ...paidFilter, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
            { $match: paidFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        ]),
        ]);

        const shape = (r: { total: number; count: number }[]) => ({
        total: r[0]?.total ?? 0,
        count: r[0]?.count ?? 0,
        });

        return ok(res, {
        today: shape(today),
        week: shape(week),
        month: shape(month),
        allTime: shape(allTime),
        });
    } catch (err) {
        next(err);
    }
}

// Admin-only: deeper breakdowns for the Stats page — top vendors by sales,
// sales by product category, and a day-by-day trend for the last 30 days
// (chart data). All figures only count paid orders.
export async function getSalesBreakdown(_req: Request, res: Response, next: NextFunction) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const paidMatch = { paymentStatus: "paid" as const };

        const byVendor = await Order.aggregate([
        { $match: paidMatch },
        { $unwind: "$subOrders" },
        {
            $group: {
            _id: "$subOrders.vendor",
            total: { $sum: "$subOrders.subtotal" },
            count: { $sum: 1 },
            },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
        {
            $lookup: {
            from: "vendors",
            localField: "_id",
            foreignField: "_id",
            as: "vendor",
            },
        },
        { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
        {
            $project: {
            _id: 0,
            vendorId: "$_id",
            storeName: "$vendor.storeName",
            total: 1,
            count: 1,
            },
        },
        ]);

        const byCategory = await Order.aggregate([
        { $match: paidMatch },
        { $unwind: "$subOrders" },
        { $unwind: "$subOrders.items" },
        {
            $lookup: {
            from: "products",
            localField: "subOrders.items.product",
            foreignField: "_id",
            as: "product",
            },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
            $group: {
            _id: { $ifNull: ["$product.category", "Uncategorized"] },
            total: {
                $sum: { $multiply: ["$subOrders.items.price", "$subOrders.items.quantity"] },
            },
            count: { $sum: "$subOrders.items.quantity" },
            },
        },
        { $sort: { total: -1 } },
        { $project: { _id: 0, category: "$_id", total: 1, count: 1 } },
        ]);

        const daily = await Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", total: 1, count: 1 } },
        ]);

        return ok(res, { byVendor, byCategory, daily });
    } catch (err) {
        next(err);
    }
}

// Transitions a seller is allowed to make on their own sub-order. Deliberately
// narrow: sellers can move an order forward through fulfillment, but cannot
// mark it "delivered" themselves (that must come from the buyer confirming,
// or an SLA auto-confirm — see PRD 8.3), and cannot touch refunds/returns
// (disputes require a neutral admin/support party). Without this, a seller
// could fake "delivered" to release their own payout without ever shipping.
const SELLER_ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
    [OrderStatus.PLACED]: [OrderStatus.CONFIRMED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PACKED],
    [OrderStatus.PACKED]: [OrderStatus.SHIPPED],
};

// Seller updates the status of their own sub-order, restricted to the
// forward-only fulfillment transitions above.
export async function updateSellerOrderStatus(
    req: Request<{ id: string; subOrderId: string }, {}, UpdateOrderStatusInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const vendor = await Vendor.findOne({ user: req.user!.userId });
        if (!vendor) {
        throw new AppError("Vendor profile not found", 404);
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
        throw new AppError("Order not found", 404);
        }

        const subOrder = order.subOrders.find(
        (s) => (s as unknown as { _id: { toString(): string } })._id.toString() === req.params.subOrderId
        );
        if (!subOrder) {
        throw new AppError("Sub-order not found", 404);
        }
        if (!subOrder.vendor.equals(vendor._id)) {
        throw new AppError("You can only update your own orders", 403);
        }

        const { status, trackingNumber } = req.body;
        const allowedNext = SELLER_ALLOWED_TRANSITIONS[subOrder.status] ?? [];
        if (!allowedNext.includes(status as OrderStatus)) {
        throw new AppError(
            `Cannot move an order from "${subOrder.status}" to "${status}". Sellers can only progress orders forward through confirmed \u2192 packed \u2192 shipped.`,
            400
        );
        }

        subOrder.status = status as OrderStatus;
        if (trackingNumber) subOrder.trackingNumber = trackingNumber;
        if (status === OrderStatus.SHIPPED) subOrder.shippedAt = new Date();

        await order.save();
        return ok(res, order);
    } catch (err) {
        next(err);
    }
}

// A logged-in seller's own orders — only the sub-orders that belong to
// their vendor store. Other sellers' items on the same order are stripped
// out, so one seller never sees another seller's sales.
export async function listSellerOrders(req: Request, res: Response, next: NextFunction) {
    try {
        const vendor = await Vendor.findOne({ user: req.user!.userId });
        if (!vendor) {
        throw new AppError("Vendor profile not found", 404);
        }

        const orders = await Order.find({ "subOrders.vendor": vendor._id })
        .populate("buyer", "name email")
        .sort({ createdAt: -1 });

        // Reshape each order to only expose this vendor's own sub-order.
        const scoped = orders.map((order) => {
        const mySubOrder = order.subOrders.find((s) => s.vendor.equals(vendor._id));
        return {
            _id: order._id,
            orderNumber: order.orderNumber,
            buyer: order.buyer,
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt,
            subOrder: mySubOrder,
        };
        });

        return ok(res, scoped);
    } catch (err) {
        next(err);
    }
}

// A logged-in buyer's own order history.
export async function listMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
        const orders = await Order.find({ buyer: req.user!.userId }).sort({ createdAt: -1 });
        return ok(res, orders);
    } catch (err) {
        next(err);
    }
}