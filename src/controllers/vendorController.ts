import { type Request, type Response, type NextFunction } from "express";
import { Vendor } from "../models/Vendor.js";
import { User } from "../models/User.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { slugify, randomSuffix } from "../utils/slugify.js";
import { VendorStatus, Role } from "../config/constants.js";
import { geocodeAddress } from "../config/geocoding.js";
import { type ApplyVendorInput, type ModerateVendorInput } from "../validators/vendorValidators.js";

// A buyer applies to become a seller. This creates a Vendor profile that
// starts PENDING — they cannot list products until an admin approves it
// (see productController.createProduct, which checks vendor.status).
export async function applyAsVendor(
    req: Request<{}, {}, ApplyVendorInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const existing = await Vendor.findOne({ user: req.user!.userId });
        const { storeName, description, logoUrl, bannerUrl, storeAddress, storeCity, storeState } = req.body;

        const fullAddress = `${storeAddress}, ${storeCity}, ${storeState}`;
        const coords = await geocodeAddress(fullAddress);
        if (!coords) {
        throw new AppError("Could not locate that address. Please check it and try again.", 400);
        }
        const location = { address: storeAddress, city: storeCity, state: storeState, lat: coords.lat, lng: coords.lng };

        // A pending or rejected applicant can (re)submit — update the same
        // record. Only an approved/suspended profile blocks a fresh
        // application, since that's an active seller account already.
        if (existing) {
        if (existing.status === VendorStatus.APPROVED || existing.status === VendorStatus.SUSPENDED) {
            throw new AppError("You already have a vendor profile", 409);
        }

        existing.storeName = storeName;
        existing.description = description;
        existing.logoUrl = logoUrl;
        existing.bannerUrl = bannerUrl;
        existing.location = location;
        existing.status = VendorStatus.PENDING;
        await existing.save();

        return ok(res, existing, 200);
        }

        const storeSlug = `${slugify(storeName)}-${randomSuffix()}`;

        const vendor = await Vendor.create({
        user: req.user!.userId,
        storeName,
        storeSlug,
        description,
        logoUrl,
        bannerUrl,
        location,
        status: VendorStatus.PENDING,
        });

        return ok(res, vendor, 201);
    } catch (err) {
        next(err);
    }
}

// The current user's own vendor profile (so the frontend can show
// "pending approval" / "approved" / "rejected" state after applying).
export async function getMyVendorProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const vendor = await Vendor.findOne({ user: req.user!.userId });
        if (!vendor) {
        throw new AppError("You do not have a vendor profile yet", 404);
        }
        return ok(res, vendor);
    } catch (err) {
        next(err);
    }
}

// Admin-only: every vendor, optionally filtered by status
// (e.g. ?status=pending for the approval queue).
export async function listVendors(req: Request, res: Response, next: NextFunction) {
    try {
        const { status } = req.query;
        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;

        const vendors = await Vendor.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: 1 });

        return ok(res, vendors);
    } catch (err) {
        next(err);
    }
}

// Admin-only: approve, reject, or suspend a vendor. Approving a vendor
// unlocks their ability to list products (createProduct checks this).
// Approving also promotes the underlying User's role to SELLER.
export async function moderateVendor(
    req: Request<{ id: string }, {}, ModerateVendorInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
        throw new AppError("Vendor not found", 404);
        }

        const { action } = req.body;

        if (action === "approve") {
        vendor.status = VendorStatus.APPROVED;
        await User.findByIdAndUpdate(vendor.user, { role: Role.SELLER });
        } else if (action === "reject") {
        vendor.status = VendorStatus.REJECTED;
        } else {
        vendor.status = VendorStatus.SUSPENDED;
        }

        await vendor.save();
        return ok(res, vendor);
    } catch (err) {
        next(err);
    }
}