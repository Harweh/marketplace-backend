import { Schema, model, Document, Types } from "mongoose";

// One review per buyer per product — enforced by the compound unique index.
export interface IReview extends Document {
    _id: Types.ObjectId;
    product: Types.ObjectId;
    buyer: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

reviewSchema.index({ product: 1, buyer: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

export const Review = model<IReview>("Review", reviewSchema);