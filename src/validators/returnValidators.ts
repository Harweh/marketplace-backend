import { z } from "zod";

export const requestReturnSchema = z.object({
    reason: z.string().trim().min(5, "Please describe the reason for your return"),
    photos: z.array(z.string().url()).max(5).optional().default([]),
});

export const resolveReturnSchema = z.object({
    approve: z.boolean(),
    adminNote: z.string().trim().optional(),
});

export type RequestReturnInput = z.infer<typeof requestReturnSchema>;
export type ResolveReturnInput = z.infer<typeof resolveReturnSchema>;