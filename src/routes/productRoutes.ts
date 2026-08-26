import { Router } from "express";
import * as productController from "../controllers/productController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Role } from "../config/constants.js";
import reviewRoutes from "./reviewRoutes.js";
import {
    createProductSchema,
    updateProductSchema,
    moderateProductSchema,
} from "../validators/productValidators.js";

const router = Router();

// Public — anyone can browse (FR-1.1 to FR-1.3)
router.get("/", productController.listProducts);

// Reviews — mounted before "/:slug" so "/some-id/reviews" (2 segments)
// resolves here; it never collides with the 1-segment slug route below.
router.use("/:productId/reviews", reviewRoutes);

router.get("/:slug", productController.getProductBySlug);

// Sellers list their own products; admins can also create products
// directly (auto-approved — see createProduct).
router.post(
    "/",
    requireAuth,
    requireRole(Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN),
    validate(createProductSchema),
    productController.createProduct
    );
    router.get(
    "/vendor/mine",
    requireAuth,
    requireRole(Role.SELLER),
    productController.listMyProducts
    );
    router.patch(
    "/:id",
    requireAuth,
    requireRole(Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN),
    validate(updateProductSchema),
    productController.updateProduct
    );
    router.patch(
    "/:id/delist",
    requireAuth,
    requireRole(Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN),
    productController.delistProduct
    );

    // Admin-only — moderation queue (FR-2.6)
    router.get(
    "/admin/queue",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    productController.getModerationQueue
    );
    router.get(
    "/admin/all",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    productController.listAllProductsAdmin
    );
    router.post(
    "/:id/moderate",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    validate(moderateProductSchema),
    productController.moderateProduct
    );

export default router;