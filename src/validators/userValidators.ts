import { z } from "zod";
import { Role } from "../config/constants.js";

// super_admin changes another user's role. Regular admins cannot promote
// people (only super_admin can) — this keeps admin creation gated to a
// small trusted circle.
export const updateUserRoleSchema = z.object({
    role: z.enum(Object.values(Role) as [string, ...string[]]),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;