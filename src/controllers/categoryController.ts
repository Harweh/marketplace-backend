import { type Request, type Response, type NextFunction } from "express";
import { Category } from "../models/Category.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { slugify } from "../utils/slugify.js";
import { type CreateCategoryInput, type UpdateCategoryInput } from "../validators/productValidators.js";

// Public — powers the category navigation menu (FR-1.2).
export async function listCategories(_req: Request, res: Response, next: NextFunction) {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        return ok(res, categories);
    } catch (err) {
        next(err);
    }
}

// Admin-only — includes inactive categories too, so the management page
// can show and re-enable ones that were switched off.
export async function listAllCategories(_req: Request, res: Response, next: NextFunction) {
    try {
        const categories = await Category.find().sort({ name: 1 });
        return ok(res, categories);
    } catch (err) {
        next(err);
    }
}

// Admin-only.
export async function createCategory(
    req: Request<{}, {}, CreateCategoryInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const { name, parentCategory } = req.body;
        const slug = slugify(name);

        const existing = await Category.findOne({ slug });
        if (existing) {
        throw new AppError("A category with this name already exists", 409);
        }

        const category = await Category.create({
        name,
        slug,
        ...(parentCategory ? { parentCategory } : {}),
        });
        return ok(res, category, 201);
    } catch (err) {
        next(err);
    }
}

// Admin-only: rename, reparent, or activate/deactivate a category.
// Deactivating hides it from the public list without deleting products
// that reference it — a category with existing products should never
// be hard-deleted.
export async function updateCategory(
    req: Request<{ id: string }, {}, UpdateCategoryInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
        throw new AppError("Category not found", 404);
        }

        const { name, parentCategory, isActive } = req.body;

        if (name && name !== category.name) {
        const newSlug = slugify(name);
        const existing = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
        if (existing) {
            throw new AppError("A category with this name already exists", 409);
        }
        category.name = name;
        category.slug = newSlug;
        }
        if (parentCategory !== undefined) category.parentCategory = parentCategory as never;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();
        return ok(res, category);
    } catch (err) {
        next(err);
    }
}

// Admin-only: hard delete — only allowed when nothing references it.
export async function deleteCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
        throw new AppError("Category not found", 404);
        }

        const childCount = await Category.countDocuments({ parentCategory: category._id });
        if (childCount > 0) {
        throw new AppError("Cannot delete a category that has sub-categories", 400);
        }

        await category.deleteOne();
        return ok(res, { deleted: true });
    } catch (err) {
        next(err);
    }
}