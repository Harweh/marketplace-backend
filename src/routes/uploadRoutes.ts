import { Router } from "express";
import * as uploadController from "../controllers/uploadController.js";
import { upload } from "../middleware/upload.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Role } from "../config/constants.js";

const router = Router();

// Sellers upload product images/sub-images (up to 6 at once).
router.post(
    "/products",
    requireAuth,
    requireRole(Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN),
    upload.array("images", 6),
    uploadController.uploadProductImages
);

// Sellers upload a single store logo/banner image.
router.post(
    "/vendor",
    requireAuth,
    requireRole(Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN),
    upload.single("image"),
    uploadController.uploadSingleImage
);

export default router;