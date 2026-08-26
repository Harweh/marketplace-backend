import { z } from "zod";

// Every field optional — a PATCH only needs to send what's changing.
export const updateProfileSchema = z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
});

export const addressSchema = z.object({
    label: z.string().trim().min(1).default("Home"),
    line1: z.string().trim().min(3),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    phone: z.string().min(7).optional(),
    isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressSchema.partial();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;