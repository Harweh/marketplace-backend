import { type Request, type Response, type NextFunction } from "express";
import { User } from "../models/User.js";
import { Vendor } from "../models/Vendor.js";
import { Order } from "../models/Order.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { type UpdateUserRoleInput } from "../validators/userValidators.js";

// Admin-only: full detail on one user — profile, addresses, their vendor
// store (if they're a seller), and their order history count as a buyer.
export async function getUserDetail(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.params.id).select("-passwordHash");
        if (!user) {
        throw new AppError("User not found", 404);
        }

        const [vendor, orderCount] = await Promise.all([
        Vendor.findOne({ user: user._id }),
        Order.countDocuments({ buyer: user._id }),
        ]);

        return ok(res, {
        user,
        vendor: vendor ?? null,
        orderCount,
        });
    } catch (err) {
        next(err);
    }
}

// Admin-only: list/search users. Supports ?q=name-or-email and ?role=.
export async function listUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const { q, role } = req.query;
        const filter: Record<string, unknown> = {};

        if (role) filter.role = role;
        if (q) {
        const regex = new RegExp(String(q), "i");
        filter.$or = [{ name: regex }, { email: regex }];
        }

        const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).limit(50);
        return ok(res, users);
    } catch (err) {
        next(err);
    }
}

// super_admin-only: change a user's role (e.g. promote to admin, or
// demote back to buyer). Guarded at the route level to SUPER_ADMIN only.
export async function updateUserRole(
    req: Request<{ id: string }, {}, UpdateUserRoleInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
        throw new AppError("User not found", 404);
        }

        user.role = req.body.role as typeof user.role;
        await user.save();

        const { passwordHash: _unused, ...safeUser } = user.toObject();
        return ok(res, safeUser);
    } catch (err) {
        next(err);
    }
}