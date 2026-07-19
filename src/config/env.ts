import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

    const envSchema = z.object({
    PORT: z.string().default("5000"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_ACCESS_SECRET: z.string().min(10, "JWT_ACCESS_SECRET is required"),
    JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET is required"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    FRONTEND_URL: z.string().default("http://localhost:3000"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    PAYSTACK_SECRET_KEY: z.string().optional(),
    PAYSTACK_PUBLIC_KEY: z.string().optional(),
    REDIS_URL: z.string().optional(),
    });

    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
    }

export const env = parsed.data;