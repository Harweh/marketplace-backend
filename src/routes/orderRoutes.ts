import { Router } from "express";
import * as orderController from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Role } from "../config/constants.js";
import { updateOrderStatusSchema } from "../validators/orderValidators.js";

const router = Router();

// A logged-in buyer's own orders.
router.get("/mine", requireAuth, orderController.listMyOrders);

// A logged-in seller's own orders (their vendor's sub-orders only).
router.get("/seller", requireAuth, requireRole(Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN), orderController.listSellerOrders);
router.patch(
    "/seller/:id/suborders/:subOrderId/status",
    requireAuth,
    requireRole(Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN),
    validate(updateOrderStatusSchema),
    orderController.updateSellerOrderStatus
);

// Admin-only: oversee every order in the system.
router.get(
    "/admin",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    orderController.listAllOrders
);
router.get(
    "/admin/stats",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    orderController.getSalesStats
);
router.get(
    "/admin/stats/breakdown",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    orderController.getSalesBreakdown
);
router.get(
    "/admin/:id",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    orderController.getOrderById
);
router.patch(
    "/admin/:id/suborders/:subOrderId/status",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    validate(updateOrderStatusSchema),
    orderController.updateOrderStatus
);

export default router;