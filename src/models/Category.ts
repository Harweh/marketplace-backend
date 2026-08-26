import { Schema, model, Document, Types } from "mongoose";

// Supports PRD FR-1.2: category and sub-category navigation.
// parentCategory is optional — top-level categories leave it unset,
// sub-categories point back to their parent.
export interface ICategory extends Document {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    parentCategory?: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        parentCategory: { type: Schema.Types.ObjectId, ref: "Category" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);


categorySchema.index({ parentCategory: 1 });

export const Category = model<ICategory>("Category", categorySchema);