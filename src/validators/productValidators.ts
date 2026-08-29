import { z } from "zod";

const variantSchema = z.object({
    sku: z.string().trim().min(1, "SKU is required"),
    attributes: z.record(z.string(), z.string()).default({}),
    price: z.number().positive("Price must be greater than 0"),
    stock: z.number().int().nonnegative("Stock cannot be negative"),
});

export const createProductSchema = z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters"),
    description: z.string().trim().min(10, "Description must be at least 10 characters"),
    category: z.string().trim().min(1, "Category is required"),
    images: z.array(z.string().url()).min(1, "At least one product image is required"),
    basePrice: z.number().positive("Base price must be greater than 0"),
    hasVariants: z.boolean().default(false),
    variants: z.array(variantSchema).optional().default([]),
    isReturnable: z.boolean().optional().default(true),
    returnWindowDays: z.number().int().min(0).max(365).optional().default(7),
});

export const updateProductSchema = createProductSchema.partial();

export const moderateProductSchema = z.object({
    action: z.enum(["approve", "reject"]),
    rejectionReason: z.string().optional(),
    }).refine(
    (data) => data.action !== "reject" || !!data.rejectionReason,
    { message: "A rejection reason is required when rejecting a product", path: ["rejectionReason"] }
);

export const createCategorySchema = z.object({
    name: z.string().trim().min(2, "Category name must be at least 2 characters"),
    parentCategory: z.string().optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().trim().min(2).optional(),
    parentCategory: z.string().optional(),
    isActive: z.boolean().optional(),
    isReturnable: z.boolean().optional().default(true),
    returnWindowDays: z.number().int().min(0).max(365).optional().default(7),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ModerateProductInput = z.infer<typeof moderateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;