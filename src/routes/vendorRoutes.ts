import { Router } from "express";
import * as vendorController from "../controllers/vendorController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Role } from "../config/constants.js";
import { applyVendorSchema, moderateVendorSchema } from "../validators/vendorValidators.js";

const router = Router();

// Any logged-in buyer can apply to become a seller.
router.post("/apply", requireAuth, validate(applyVendorSchema), vendorController.applyAsVendor);
router.get("/me", requireAuth, vendorController.getMyVendorProfile);

// Admin-only: view and moderate vendor applications.
router.get(
    "/admin",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    vendorController.listVendors
);
router.patch(
    "/:id/moderate",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    validate(moderateVendorSchema),
    vendorController.moderateVendor
);

export default router;