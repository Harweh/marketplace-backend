import { z } from "zod";

export const checkoutSchema = z.object({
    items: z
        .array(
        z.object({
            productId: z.string().min(1),
            sku: z.string().optional(),
            quantity: z.number().int().min(1),
        })
        )
        .min(1, "Cart cannot be empty"),
    shippingAddress: z.object({
        line1: z.string().trim().min(3),
        city: z.string().trim().min(1),
        state: z.string().trim().min(1),
        phone: z.string().min(7),
    }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;