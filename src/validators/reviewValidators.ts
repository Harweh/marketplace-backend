import { z } from "zod";

export const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3, "Please write a short comment"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;