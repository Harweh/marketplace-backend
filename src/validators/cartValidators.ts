import { z } from "zod";

// Cart/wishlist sync is full-replace: the frontend sends its complete,
// merged state and this becomes the new source of truth in the database.
// Simple and safe at this scale — no need for granular add/remove
// endpoints when the whole array is a handful of items.
export const syncCartSchema = z.object({
    items: z.array(
        z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        selectedSku: z.string().optional(),
        })
    ),
});

export const syncWishlistSchema = z.object({
    productIds: z.array(z.string().min(1)),
});

export type SyncCartInput = z.infer<typeof syncCartSchema>;
export type SyncWishlistInput = z.infer<typeof syncWishlistSchema>;