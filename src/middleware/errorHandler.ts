import { type Request, type Response, type NextFunction } from "express";
import { fail } from "../utils/response.js";

export class AppError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
    ) {
    if (err instanceof AppError) {
        return fail(res, err.message, err.status);
    }

    console.error("Unhandled error:", err);
    return fail(res, "Something went wrong. Please try again.", 500);
}

export function notFoundHandler(req: Request, res: Response) {
    return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}