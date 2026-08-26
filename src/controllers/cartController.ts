import { type Request, type Response, type NextFunction } from "express";
import { Types } from "mongoose";
import { User } from "../models/User.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { type SyncCartInput, type SyncWishlistInput } from "../validators/cartValidators.js";

// Returns the logged-in user's cart with full product details populated —
// the frontend needs images/price/title, not just an id + quantity.
export async function getCart(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.user!.userId).populate("cart.product");
        if (!user) {
        throw new AppError("User not found", 404);
        }
        return ok(res, user.cart ?? []);
    } catch (err) {
        next(err);
    }
}

// Full-replace sync — called after every cart mutation (add/remove/update
// quantity) and once on login to merge in whatever was in localStorage.
export async function syncCart(req: Request<{}, {}, SyncCartInput>, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
        throw new AppError("User not found", 404);
        }

        user.cart = req.body.items.map((item) => ({
        product: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        selectedSku: item.selectedSku,
        }));

        await user.save();
        const populated = await user.populate("cart.product");
        return ok(res, populated.cart ?? []);
    } catch (err) {
        next(err);
    }
}

// Returns the logged-in user's wishlist with full product details populated.
export async function getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.user!.userId).populate("wishlist");
        if (!user) {
        throw new AppError("User not found", 404);
        }
        return ok(res, user.wishlist ?? []);
    } catch (err) {
        next(err);
    }
}

// Full-replace sync for the wishlist, same pattern as cart.
export async function syncWishlist(req: Request<{}, {}, SyncWishlistInput>, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
        throw new AppError("User not found", 404);
        }

        user.wishlist = req.body.productIds.map((id) => new Types.ObjectId(id));
        await user.save();
        const populated = await user.populate("wishlist");
        return ok(res, populated.wishlist ?? []);
    } catch (err) {
        next(err);
    }
}