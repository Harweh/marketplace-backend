import { Router } from "express";
import * as categoryController from "../controllers/categoryController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Role } from "../config/constants.js";
import { createCategorySchema, updateCategorySchema } from "../validators/productValidators.js";

const router = Router();

router.get("/", categoryController.listCategories);

router.get(
    "/admin",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    categoryController.listAllCategories
);

router.post(
    "/",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    validate(createCategorySchema),
    categoryController.createCategory
);

router.patch(
    "/:id",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    validate(updateCategorySchema),
    categoryController.updateCategory
);

router.delete(
    "/:id",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    categoryController.deleteCategory
);

export default router;