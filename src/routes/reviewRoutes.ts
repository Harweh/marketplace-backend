import { Router } from "express";
import * as reviewController from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema } from "../validators/reviewValidators.js";

// Mounted at /api/products/:productId/reviews (mergeParams gives us
// access to :productId from the parent router).
const router = Router({ mergeParams: true });

router.get("/", reviewController.listReviews);
router.get("/eligibility", requireAuth, reviewController.getReviewEligibility);
router.post("/", requireAuth, validate(createReviewSchema), reviewController.createReview);
router.delete("/:reviewId", requireAuth, reviewController.deleteReview);

export default router;