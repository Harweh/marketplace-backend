import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    }
}

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
});