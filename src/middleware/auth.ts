import { type Request, type Response, type NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.js";
import { fail } from "../utils/response.js";
import { Role } from "../config/constants.js";

declare global {
    namespace Express {
        interface Request {
        user?: { userId: string; role: Role };
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return fail(res, "Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token as string);
        req.user = payload;
        next();
    } catch {
        return fail(res, "Invalid or expired token", 401);
    }
}

export function requireRole(...allowedRoles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
        return fail(res, "Authentication required", 401);
        }
        if (!allowedRoles.includes(req.user.role)) {
        return fail(res, "You do not have permission to perform this action", 403);
        }
        next();
    };
}