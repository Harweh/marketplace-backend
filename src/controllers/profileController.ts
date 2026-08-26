import { type Request, type Response, type NextFunction } from "express";
import { User } from "../models/User.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import {
    type UpdateProfileInput,
    type AddressInput,
    type UpdateAddressInput,
} from "../validators/profileValidators.js";

function safeUser(user: InstanceType<typeof User>) {
    const { passwordHash: _unused, ...rest } = user.toObject();
    return rest;
}

// Update the logged-in user's own name/email/phone.
export async function updateMyProfile(
    req: Request<{}, {}, UpdateProfileInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
        throw new AppError("User not found", 404);
        }

        const { name, email, phone } = req.body;

        if (email && email !== user.email) {
        const existing = await User.findOne({ email, _id: { $ne: user._id } });
        if (existing) {
            throw new AppError("An account with this email already exists", 409);
        }
        user.email = email;
        }
        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();
        return ok(res, safeUser(user));
    } catch (err) {
        next(err);
    }
}

// Add a new saved address (e.g. "Home", "Office", "Mum's House").
export async function addAddress(
    req: Request<{}, {}, AddressInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
        throw new AppError("User not found", 404);
        }

        const newAddress = req.body;

        // Only one address can be default — unset any existing default
        // if this one is being marked as the new default.
        if (newAddress.isDefault) {
        user.addresses?.forEach((a) => (a.isDefault = false));
        }

        user.addresses = user.addresses ?? [];
        user.addresses.push({
        label: newAddress.label ?? "Home",
        line1: newAddress.line1,
        city: newAddress.city,
        state: newAddress.state,
        phone: newAddress.phone,
        isDefault: newAddress.isDefault ?? user.addresses.length === 0, // first address is default by default
        });

        await user.save();
        return ok(res, safeUser(user), 201);
    } catch (err) {
        next(err);
    }
}

// Edit an existing saved address by its subdocument id.
export async function updateAddress(
    req: Request<{ addressId: string }, {}, UpdateAddressInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
        throw new AppError("User not found", 404);
        }

        const address = user.addresses?.find(
        (a) => (a as unknown as { _id: { toString(): string } })._id.toString() === req.params.addressId
        );
        if (!address) {
        throw new AppError("Address not found", 404);
        }

        const updates = req.body;
        if (updates.isDefault) {
        user.addresses?.forEach((a) => (a.isDefault = false));
        }

        Object.assign(address, updates);
        await user.save();
        return ok(res, safeUser(user));
    } catch (err) {
        next(err);
    }
}

// Remove a saved address.
export async function deleteAddress(req: Request<{ addressId: string }>, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
        throw new AppError("User not found", 404);
        }

        user.addresses = user.addresses?.filter(
        (a) => (a as unknown as { _id: { toString(): string } })._id.toString() !== req.params.addressId
        );

        await user.save();
        return ok(res, safeUser(user));
    } catch (err) {
        next(err);
    }
}