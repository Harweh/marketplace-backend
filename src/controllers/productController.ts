import { type Request, type Response, type NextFunction } from "express";
import { Product } from "../models/Product.js";
import { Vendor } from "../models/Vendor.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { slugify, randomSuffix } from "../utils/slugify.js";
import { ProductStatus, VendorStatus, Role } from "../config/constants.js";
import { type CreateProductInput, type ModerateProductInput } from "../validators/productValidators.js";

// A seller creates a listing — it always starts as PENDING_REVIEW (FR-2.6),
// never immediately visible to buyers, no matter what the seller sends.
//
// An admin creating a listing directly is auto-approved instead, since
// there's no one above them left to review it. Admins have no personal
// Vendor profile, so their products are attributed to a single shared
// "Platform" store, created on first use.
export async function createProduct(
    req: Request<{}, {}, CreateProductInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.SUPER_ADMIN;

        let vendor;
        let status: ProductStatus;

        if (isAdmin) {
        vendor = await Vendor.findOne({ storeSlug: "platform" });
        if (!vendor) {
            vendor = await Vendor.create({
            user: req.user!.userId,
            storeName: "Platform",
            storeSlug: "platform",
            status: VendorStatus.APPROVED,
            });
        }
        status = ProductStatus.APPROVED;
        } else {
        const sellerVendor = await Vendor.findOne({ user: req.user!.userId });
        if (!sellerVendor) {
            throw new AppError("You need an approved vendor profile to list products", 403);
        }
        if (sellerVendor.status !== VendorStatus.APPROVED) {
            throw new AppError("Your vendor account is not yet approved", 403);
        }
        vendor = sellerVendor;
        status = ProductStatus.PENDING_REVIEW;
        }

        const { title, description, category, images, basePrice, hasVariants, variants } = req.body;

        const slug = `${slugify(title)}-${randomSuffix()}`;
        const totalStock = hasVariants
        ? variants.reduce((sum, v) => sum + v.stock, 0)
        : 0;

        const product = await Product.create({
        vendor: vendor._id,
        title,
        slug,
        description,
        category,
        images,
        basePrice,
        hasVariants,
        variants,
        totalStock,
        status,
        });

        return ok(res, product, 201);
    } catch (err) {
        next(err);
    }
}

// Public listing endpoint — buyers only ever see APPROVED products.
// Supports basic filtering per FR-1.3: category, price range, search text.
export async function listProducts(req: Request, res: Response, next: NextFunction) {
    try {
        const { category, minPrice, maxPrice, q, page = "1", limit = "20" } = req.query;

        const filter: Record<string, unknown> = { status: ProductStatus.APPROVED };

        if (category) filter.category = category;
        if (minPrice || maxPrice) {
        filter.basePrice = {
            ...(minPrice ? { $gte: Number(minPrice) } : {}),
            ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
        };
        }
        if (q) filter.$text = { $search: String(q) };

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));

        const [products, total] = await Promise.all([
        Product.find(filter)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .sort({ createdAt: -1 }),
        Product.countDocuments(filter),
        ]);

        return ok(res, { products, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    } catch (err) {
        next(err);
    }
}

export async function getProductBySlug(
    req: Request<{ slug: string }>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const product = await Product.findOne({
        slug: req.params.slug,
        status: ProductStatus.APPROVED,
        }).populate("vendor", "storeName storeSlug rating");

        if (!product) {
        throw new AppError("Product not found", 404);
        }

        return ok(res, product);
    } catch (err) {
        next(err);
    }
}

// A seller's own product list — includes pending and rejected items too,
// unlike the public listProducts endpoint above.
export async function listMyProducts(req: Request, res: Response, next: NextFunction) {
    try {
        const vendor = await Vendor.findOne({ user: req.user!.userId });
        if (!vendor) {
        throw new AppError("Vendor profile not found", 404);
        }

        const products = await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 });
        return ok(res, products);
    } catch (err) {
        next(err);
    }
}

// Admin-only: the moderation queue (FR-2.6).
// Admin-only: every product regardless of status — for the full record
// view (unlike listProducts above, which only ever shows approved items,
// and getModerationQueue, which only shows pending ones).
export async function listAllProductsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const { status } = req.query;
        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;

        const products = await Product.find(filter)
        .populate("vendor", "storeName")
        .sort({ createdAt: -1 });

        return ok(res, products);
    } catch (err) {
        next(err);
    }
}

export async function getModerationQueue(_req: Request, res: Response, next: NextFunction) {
    try {
        const products = await Product.find({ status: ProductStatus.PENDING_REVIEW })
        .populate("vendor", "storeName")
        .sort({ createdAt: 1 }); // oldest first — fair queue order

        return ok(res, products);
    } catch (err) {
        next(err);
    }
}

// Admin-only: approve or reject a pending product.
export async function moderateProduct(
    req: Request<{ id: string }, {}, ModerateProductInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
        throw new AppError("Product not found", 404);
        }

        const { action, rejectionReason } = req.body;

        product.status = action === "approve" ? ProductStatus.APPROVED : ProductStatus.REJECTED;
        product.rejectionReason = action === "reject" ? rejectionReason : undefined;
        await product.save();

        // TODO (Step 7): trigger a notification to the seller here (PRD FR-8.2)

        return ok(res, product);
    } catch (err) {
        next(err);
    }
}

// Seller or admin can update a listing. Sellers may only edit their own
// products; editing resets it back to PENDING_REVIEW so nothing bypasses
// moderation by slipping in an edit after approval.
export async function updateProduct(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
        throw new AppError("Product not found", 404);
        }

        if (req.user!.role === Role.SELLER) {
        const vendor = await Vendor.findOne({ user: req.user!.userId });
        if (!vendor || !product.vendor.equals(vendor._id)) {
            throw new AppError("You can only edit your own products", 403);
        }
        }

        // Only fields that could be used to bait-and-switch a listing after
        // it's been approved (swap the photos/description of a legitimate
        // product for something else while keeping the "approved" trust
        // signal) send it back through moderation. Routine operational
        // changes — price, stock, variants — never require re-approval,
        // or sellers couldn't manage inventory day to day.
        const body = req.body as Record<string, unknown>;
        const changedTrustSensitiveField =
        ("title" in body && body.title !== product.title) ||
        ("description" in body && body.description !== product.description) ||
        ("category" in body && body.category !== product.category) ||
        ("images" in body && JSON.stringify(body.images) !== JSON.stringify(product.images));

        Object.assign(product, req.body);

        if (req.user!.role === Role.SELLER && changedTrustSensitiveField) {
        product.status = ProductStatus.PENDING_REVIEW;
        }

        await product.save();
        return ok(res, product);
    } catch (err) {
        next(err);
    }
}

// A seller soft-deletes their own product — never a hard delete, since
// past orders reference it and order history must stay intact. Delisted
// products simply stop appearing in the public shop.
export async function delistProduct(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
        throw new AppError("Product not found", 404);
        }

        if (req.user!.role === Role.SELLER) {
        const vendor = await Vendor.findOne({ user: req.user!.userId });
        if (!vendor || !product.vendor.equals(vendor._id)) {
            throw new AppError("You can only delist your own products", 403);
        }
        }

        product.status = ProductStatus.DELISTED;
        await product.save();
        return ok(res, product);
    } catch (err) {
        next(err);
    }
}