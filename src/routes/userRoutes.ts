import { Router } from "express";
import * as userController from "../controllers/userController.js";
import * as profileController from "../controllers/profileController.js";
import * as cartController from "../controllers/cartController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Role } from "../config/constants.js";
import { updateUserRoleSchema } from "../validators/userValidators.js";
import { updateProfileSchema, addressSchema, updateAddressSchema } from "../validators/profileValidators.js";
import { syncCartSchema, syncWishlistSchema } from "../validators/cartValidators.js";

const router = Router();

// Any logged-in user manages their own profile and saved addresses.
router.patch("/me", requireAuth, validate(updateProfileSchema), profileController.updateMyProfile);
router.post("/me/addresses", requireAuth, validate(addressSchema), profileController.addAddress);
router.patch("/me/addresses/:addressId", requireAuth, validate(updateAddressSchema), profileController.updateAddress);
router.delete("/me/addresses/:addressId", requireAuth, profileController.deleteAddress);

router.get("/me/cart", requireAuth, cartController.getCart);
router.put("/me/cart", requireAuth, validate(syncCartSchema), cartController.syncCart);

router.get("/me/wishlist", requireAuth, cartController.getWishlist);
router.put("/me/wishlist", requireAuth, validate(syncWishlistSchema), cartController.syncWishlist);

// Any admin can search/view users.
router.get(
    "/admin",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    userController.listUsers
);

router.get(
    "/admin/:id",
    requireAuth,
    requireRole(Role.ADMIN, Role.SUPER_ADMIN),
    userController.getUserDetail
);

// Only super_admin can change roles — prevents a regular admin from
// promoting themselves or others to admin.
router.patch(
    "/:id/role",
    requireAuth,
    requireRole(Role.SUPER_ADMIN),
    validate(updateUserRoleSchema),
    userController.updateUserRole
);

export default router;