import { z } from "zod";

// A buyer applies to become a seller by creating their store profile.
export const applyVendorSchema = z.object({
    storeName: z.string().trim().min(2, "Store name must be at least 2 characters"),
    description: z.string().trim().optional(),
    logoUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
    storeAddress: z.string().trim().min(5, "Store address is required for shipping calculations"),
    storeCity: z.string().trim().min(1, "City is required"),
    storeState: z.string().trim().min(1, "State is required"),
});

// Admin approves, rejects, or suspends a vendor.
export const moderateVendorSchema = z.object({
    action: z.enum(["approve", "reject", "suspend"]),
});

export type ApplyVendorInput = z.infer<typeof applyVendorSchema>;
export type ModerateVendorInput = z.infer<typeof moderateVendorSchema>;