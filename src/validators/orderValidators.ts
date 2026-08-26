import { z } from "zod";
import { OrderStatus } from "../config/constants.js";

// Admin updates one sub-order's status (e.g. confirm, ship, cancel, refund).
// Orders are split per-vendor into subOrders, so status changes target a
// specific subOrder, not the whole order.
export const updateOrderStatusSchema = z.object({
    status: z.enum(Object.values(OrderStatus) as [string, ...string[]]),
    trackingNumber: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;