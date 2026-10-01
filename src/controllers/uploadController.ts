import { type Request, type Response, type NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import { ok } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";

// Streams an in-memory file buffer up to Cloudinary and returns its
// hosted URL. Used by sellers when adding product images/sub-images,
// and by vendors for store logo/banner.
function streamUpload(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result) => {
            if (error || !result) return reject(error);
            resolve(result.secure_url);
        }
        );
        stream.end(buffer);
    });
}

// Accepts one or more images (field name "images") and returns their
// hosted URLs in the same order they were uploaded.
export async function uploadProductImages(req: Request, res: Response, next: NextFunction) {
    try {
        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) {
        throw new AppError("At least one image file is required", 400);
        }

        const urls = await Promise.all(
        files.map((file) => streamUpload(file.buffer, "products"))
        );

        return ok(res, { urls }, 201);
    } catch (err) {
        next(err);
    }
}

// Accepts a single image (field name "image") — used for vendor
// store logo/banner uploads.
export async function uploadSingleImage(req: Request, res: Response, next: NextFunction) {
    try {
        const file = req.file as Express.Multer.File | undefined;
        if (!file) {
        throw new AppError("An image file is required", 400);
        }

        const url = await streamUpload(file.buffer, "vendors");
        return ok(res, { url }, 201);
    } catch (err) {
        next(err);
    }
}