import { type Request, type Response, type NextFunction } from "express";
import { Types } from "mongoose";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { OrderStatus } from "../config/constants.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { type CreateReviewInput } from "../validators/reviewValidators.js";

// A buyer is only allowed to review a product once they've actually
// received it (PRD FR-7.1 — verified-purchase-only reviews). Checks for
// any order where this exact product appears inside a sub-order that has
// reached DELIVERED or COMPLETED.
async function hasVerifiedPurchase(buyerId: string, productId: string): Promise<boolean> {
    const order = await Order.findOne({
        buyer: buyerId,
        subOrders: {
        $elemMatch: {
            status: { $in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
            items: { $elemMatch: { product: new Types.ObjectId(productId) } },
        },
        },
    });
    return !!order;
}

// Recomputes and stores a product's average rating + count so product
// list/detail reads don't need to aggregate reviews every time.
async function recalculateProductRating(productId: string) {
    const stats = await Review.aggregate([
        { $match: { product: new Types.ObjectId(productId) } },
        { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    const average = stats[0]?.average ?? 0;
    const count = stats[0]?.count ?? 0;

    await Product.findByIdAndUpdate(productId, {
        ratingAverage: Math.round(average * 10) / 10,
        reviewCount: count,
    });
}

// Public — reviews for a product's detail page.
export async function listReviews(req: Request<{ productId: string }>, res: Response, next: NextFunction) {
    try {
        const reviews = await Review.find({ product: req.params.productId })
        .populate("buyer", "name")
        .sort({ createdAt: -1 });
        return ok(res, reviews);
    } catch (err) {
        next(err);
    }
}

// Lets the frontend check upfront whether the logged-in buyer is eligible
// to review this product, so it can show/hide the review form instead of
// letting them fill it out only to be rejected on submit.
export async function getReviewEligibility(req: Request<{ productId: string }>, res: Response, next: NextFunction) {
    try {
        const alreadyReviewed = await Review.exists({ product: req.params.productId, buyer: req.user!.userId });
        if (alreadyReviewed) {
        return ok(res, { eligible: false, reason: "already_reviewed" });
        }

        const verified = await hasVerifiedPurchase(req.user!.userId, req.params.productId);
        return ok(res, { eligible: verified, reason: verified ? null : "not_purchased" });
    } catch (err) {
        next(err);
    }
}

// A logged-in buyer leaves a review — one per product per buyer, enforced
// by the model's unique index as a hard backstop even if this check races.
export async function createReview(
    req: Request<{ productId: string }, {}, CreateReviewInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
        throw new AppError("Product not found", 404);
        }

        const existing = await Review.findOne({ product: product._id, buyer: req.user!.userId });
        if (existing) {
        throw new AppError("You have already reviewed this product", 409);
        }

        const verified = await hasVerifiedPurchase(req.user!.userId, product.id);
        if (!verified) {
        throw new AppError("You can only review products you've purchased and received", 403);
        }

        const review = await Review.create({
        product: product._id,
        buyer: req.user!.userId,
        rating: req.body.rating,
        comment: req.body.comment,
        });

        await recalculateProductRating(product.id);

        const populated = await review.populate("buyer", "name");
        return ok(res, populated, 201);
    } catch (err) {
        next(err);
    }
}

// A buyer deletes their own review.
export async function deleteReview(req: Request<{ productId: string; reviewId: string }>, res: Response, next: NextFunction) {
    try {
        const review = await Review.findOne({ _id: req.params.reviewId, buyer: req.user!.userId });
        if (!review) {
        throw new AppError("Review not found", 404);
        }

        await review.deleteOne();
        await recalculateProductRating(req.params.productId);

        return ok(res, { deleted: true });
    } catch (err) {
        next(err);
    }
}