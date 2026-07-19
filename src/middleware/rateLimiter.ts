import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        error: { message: "Too many attempts. Please try again later." },
    },
    standardHeaders: true,
    legacyHeaders: false,
});