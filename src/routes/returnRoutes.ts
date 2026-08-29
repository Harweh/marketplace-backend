import { Router } from "express";
import * as returnController from "../controllers/returnController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Role } from "../config/constants.js";
import { requestReturnSchema, resolveReturnSchema } from "../validators/returnValidators.js";

const router = Router();

// Buyer requests a return on their own delivered order.
router.post(
    "/:orderId/suborders/:subOrderId/request",
    requireAuth,
    validate(requestReturnSchema),
    returnController.requestReturn
);

// Admin/support resolves a pending return.
router.patch(
    "/:orderId/suborders/:subOrderId/resolve",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPPORT),
    validate(resolveReturnSchema),
    returnController.resolveReturn
);

// Admin-only: the full queue of pending returns.
router.get(
    "/admin/pending",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPPORT),
    returnController.listPendingReturns
);

export default router;