import { type Request, type Response, type NextFunction } from "express";
import { type ZodSchema } from "zod";
import { fail } from "../utils/response.js";

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
        return fail(res, "Validation failed", 422, result.error.flatten().fieldErrors);
        }
        req.body = result.data;
        next();
    };
}