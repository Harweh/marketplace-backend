import { type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { ok, fail } from "../utils/response.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { env } from "../config/env.js";
import { sendEmail } from "../config/email.js";
import { welcomeEmail, passwordResetEmail } from "../utils/emailTemplates.js";
import { Role } from "../config/constants.js";
import { AppError } from "../middleware/errorHandler.js";
import { type ForgotPasswordInput, type ResetPasswordInput } from "../validators/passwordResetValidators.js";

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, email, password, phone } = req.body;

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
        throw new AppError("An account with this email already exists", 409);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone,
        role: Role.BUYER,
        });

        const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
        const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

        const { subject, html } = welcomeEmail(user.name);
        sendEmail(user.email, subject, html).catch(() => {});

        return ok(res, {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
        }, 201);
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
        if (!user) {
        return fail(res, "Invalid email or password", 401);
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
        return fail(res, "Invalid email or password", 401);
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
        // session.
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

export async function me(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
        return fail(res, "User not found", 404);
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

// Re-confirms the logged-in user's password without issuing new tokens —
// used to gate entry into the super_admin area once per session.
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

// Never reveal whether an email exists — always return the same success
// message either way.
export async function forgotPassword(
    req: Request<{}, {}, ForgotPasswordInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });

        if (user) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        const resetLink = `${env.FRONTEND_URL}/reset-password/${rawToken}`;
        const { subject, html } = passwordResetEmail(user.name, resetLink);
        sendEmail(user.email, subject, html).catch(() => {});
        }

        return ok(res, { message: "If that email is registered, a reset link has been sent." });
    } catch (err) {
        next(err);
    }
}

export async function resetPassword(
    req: Request<{}, {}, ResetPasswordInput>,
    res: Response,
    next: NextFunction
    ) {
    try {
        const hashedToken = crypto.createHash("sha256").update(req.body.token).digest("hex");

        const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
        return fail(res, "This reset link is invalid or has expired.", 400);
        }

        user.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return ok(res, { message: "Password updated. You can now log in." });
    } catch (err) {
        next(err);
    }
}