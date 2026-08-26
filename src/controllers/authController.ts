// import { type Request, type Response, type NextFunction } from "express";
// import bcrypt from "bcryptjs";
// import { User } from "../models/User.js";
// import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
// import { ok, fail } from "../utils/response.js";
// import { AppError } from "../middleware/errorHandler.js";
// import { type RegisterInput, type LoginInput } from "../validators/authValidators.js";
// import { Role } from "../config/constants.js";

// const SALT_ROUNDS = 10;

// export async function register(
//     req: Request<{}, {}, RegisterInput>,
//     res: Response,
//     next: NextFunction
//     ) {
//     try {
//         const { name, email, password, phone } = req.body;

//         const existing = await User.findOne({ email });
//         if (existing) {
//         throw new AppError("An account with this email already exists", 409);
//         }

//         const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

//         const user = await User.create({
//         name,
//         email,
//         passwordHash,
//         role: Role.BUYER,
//         ...(phone ? { phone } : {}),
//         });

        
//         const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
//         const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

//         return ok(
//         res,
//         {
//             user: { id: user._id, name: user.name, email: user.email, role: user.role },
//             accessToken,
//             refreshToken,
//         },
//         201
//         );
//     } catch (err) {
//         next(err);
//     }
// }

// export async function login(
//     req: Request<{}, {}, LoginInput>,
//     res: Response,
//     next: NextFunction
//     ) {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email }).select("+passwordHash");
//         if (!user) {
//         throw new AppError("Invalid email or password", 401);
//         }

//         if (!user.isActive) {
//         throw new AppError("This account has been deactivated", 403);
//         }

//         const isMatch = await bcrypt.compare(password, user.passwordHash);
//         if (!isMatch) {
//         throw new AppError("Invalid email or password", 401);
//         }

//     const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
//     const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

//     return ok(res, {
//         user: { id: user._id, name: user.name, email: user.email, role: user.role },
//         accessToken,
//         refreshToken,
//         });
//     } catch (err) {
//         next(err);
//     }
// }

// export async function refresh(req: Request, res: Response, next: NextFunction) {
//     try {
//         const { refreshToken } = req.body;
//         if (!refreshToken) {
//         return fail(res, "Refresh token is required", 400);
//         }

//         const payload = verifyRefreshToken(refreshToken);
//         const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });

//         return ok(res, { accessToken });
//     } catch {
//         return fail(res, "Invalid or expired refresh token", 401);
//     }
// }

// export async function me(req: Request, res: Response, next: NextFunction) {
//     try {
//         const user = await User.findById(req.user!.userId);
//         if (!user) {
//         throw new AppError("User not found", 404);
//         }
//         return ok(res, {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         phone: user.phone,
//         addresses: user.addresses ?? [],
//         });
//     } catch (err) {
//         next(err);
//     }
// }



// import { type Request, type Response, type NextFunction } from "express";
// import bcrypt from "bcryptjs";
// import { User } from "../models/User.js";
// import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
// import { ok, fail } from "../utils/response.js";
// import { AppError } from "../middleware/errorHandler.js";
// import { type RegisterInput, type LoginInput } from "../validators/authValidators.js";
// import { Role } from "../config/constants.js";

// const SALT_ROUNDS = 10;

// export async function register(
//     req: Request<{}, {}, RegisterInput>,
//     res: Response,
//     next: NextFunction
//     ) {
//     try {
//         const { name, email, password, phone } = req.body;

//         const existing = await User.findOne({ email });
//         if (existing) {
//         throw new AppError("An account with this email already exists", 409);
//         }

//         const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

//         const user = await User.create({
//         name,
//         email,
//         passwordHash,
//         role: Role.BUYER,
//         ...(phone ? { phone } : {}),
//         });

        
//         const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
//         const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

//         return ok(
//         res,
//         {
//             user: { id: user._id, name: user.name, email: user.email, role: user.role },
//             accessToken,
//             refreshToken,
//         },
//         201
//         );
//     } catch (err) {
//         next(err);
//     }
// }

// export async function login(
//     req: Request<{}, {}, LoginInput>,
//     res: Response,
//     next: NextFunction
//     ) {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email }).select("+passwordHash");
//         if (!user) {
//         throw new AppError("Invalid email or password", 401);
//         }

//         if (!user.isActive) {
//         throw new AppError("This account has been deactivated", 403);
//         }

//         const isMatch = await bcrypt.compare(password, user.passwordHash);
//         if (!isMatch) {
//         throw new AppError("Invalid email or password", 401);
//         }

//     const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
//     const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

//     return ok(res, {
//         user: { id: user._id, name: user.name, email: user.email, role: user.role },
//         accessToken,
//         refreshToken,
//         });
//     } catch (err) {
//         next(err);
//     }
// }

// export async function refresh(req: Request, res: Response, next: NextFunction) {
//     try {
//         const { refreshToken } = req.body;
//         if (!refreshToken) {
//         return fail(res, "Refresh token is required", 400);
//         }

//         const payload = verifyRefreshToken(refreshToken);

//         // Re-read the role from the database instead of trusting the role
//         // baked into the old token — otherwise a role change (e.g. a buyer
//         // approved as a seller) would never take effect for a signed-in
//         // session, since silent token refresh would just keep reissuing
//         // the stale role forever.
//         const user = await User.findById(payload.userId);
//         if (!user) {
//         return fail(res, "User no longer exists", 401);
//         }

//         const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });

//         return ok(res, { accessToken });
//     } catch {
//         return fail(res, "Invalid or expired refresh token", 401);
//     }
// }

// export async function me(req: Request, res: Response, next: NextFunction) {
//     try {
//         const user = await User.findById(req.user!.userId);
//         if (!user) {
//         throw new AppError("User not found", 404);
//         }
//         return ok(res, {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         phone: user.phone,
//         addresses: user.addresses ?? [],
//         });
//     } catch (err) {
//         next(err);
//     }
// }


import { type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { ok, fail } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { type RegisterInput, type LoginInput } from "../validators/authValidators.js";
import { Role } from "../config/constants.js";

const SALT_ROUNDS = 10;

export async function register(
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const { name, email, password, phone } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
        throw new AppError("An account with this email already exists", 409);
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await User.create({
        name,
        email,
        passwordHash,
        role: Role.BUYER,
        ...(phone ? { phone } : {}),
        });

        
        const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
        const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

        return ok(
        res,
        {
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            accessToken,
            refreshToken,
        },
        201
        );
    } catch (err) {
        next(err);
    }
}

export async function login(
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+passwordHash");
        if (!user) {
        throw new AppError("Invalid email or password", 401);
        }

        if (!user.isActive) {
        throw new AppError("This account has been deactivated", 403);
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
        }

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

    return ok(res, {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
        });
    } catch (err) {
        next(err);
    }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
        return fail(res, "Refresh token is required", 400);
        }

        const payload = verifyRefreshToken(refreshToken);

        // Re-read the role from the database instead of trusting the role
        // baked into the old token — otherwise a role change (e.g. a buyer
        // approved as a seller) would never take effect for a signed-in
        // session, since silent token refresh would just keep reissuing
        // the stale role forever.
        const user = await User.findById(payload.userId);
        if (!user) {
        return fail(res, "User no longer exists", 401);
        }

        const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });

        return ok(res, { accessToken });
    } catch {
        return fail(res, "Invalid or expired refresh token", 401);
    }
}

// Re-confirms the logged-in user's password without issuing new tokens —
// used to gate entry into the super_admin area once per session, even
// though they're already authenticated. Protects against someone using
// an unlocked/unattended browser session to reach the highest-privilege
// area of the app.
export async function verifyPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { password } = req.body as { password?: string };
        if (!password) {
        return fail(res, "Password is required", 400);
        }

        const user = await User.findById(req.user!.userId).select("+passwordHash");
        if (!user) {
        return fail(res, "User not found", 404);
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
        return fail(res, "Incorrect password", 401);
        }

        return ok(res, { verified: true });
    } catch (err) {
        next(err);
    }
}

export async function me(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
        throw new AppError("User not found", 404);
        }
        return ok(res, {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses ?? [],
        });
    } catch (err) {
        next(err);
    }
}