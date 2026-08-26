import { Schema, model, Document, Types } from "mongoose";
import { ProductStatus } from "../config/constants.js";

interface IVariant {
    sku: string;
    attributes: Record<string, string>;
    price: number;
    stock: number;
}

export interface IProduct extends Document {
    _id: Types.ObjectId;
    vendor: Types.ObjectId;
    title: string;
    slug: string;
    description: string;
    category: string;
    images: string[];
    basePrice: number;
    hasVariants: boolean;
    variants: IVariant[];
    totalStock: number;
    ratingAverage: number;
    reviewCount: number;
    status: ProductStatus;
    rejectionReason?: string | undefined;
    createdAt: Date;
    updatedAt: Date;
}

const variantSchema = new Schema<IVariant>(
    {
        sku: { type: String, required: true },
        attributes: { type: Schema.Types.Mixed, default: {} },
        price: { type: Number, required: true },
        stock: { type: Number, required: true, default: 0 },
    },
    { _id: false }
);

const productSchema = new Schema<IProduct>(
    {
        vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: { type: String, required: true },
        category: { type: String, required: true },
        images: [{ type: String }],
        basePrice: { type: Number, required: true },
        hasVariants: { type: Boolean, default: false },
        variants: [variantSchema],
        totalStock: { type: Number, default: 0 },
        ratingAverage: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        status: {
        type: String,
        enum: Object.values(ProductStatus),
        default: ProductStatus.PENDING_REVIEW,
        },
        rejectionReason: { type: String },
    },
    { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ vendor: 1 });

export const Product = model<IProduct>("Product", productSchema);