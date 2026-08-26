// One-off utility: resets any user's password directly in the database.
// Run from the backend terminal — never exposed as an API endpoint, so
// no one can trigger this remotely.
//
// Usage:
//   npx tsx src/scripts/resetPassword.ts someone@example.com "NewPassword123"

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

async function run() {
    const [, , email, newPassword] = process.argv;

    if (!email || !newPassword) {
        console.error('Usage: npx tsx src/scripts/resetPassword.ts <email> "<newPassword>"');
        process.exit(1);
    }
    if (newPassword.length < 8) {
        console.error("Password must be at least 8 characters.");
        process.exit(1);
    }

    await mongoose.connect(env.MONGODB_URI);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        console.error(`❌ No user found with email "${email}".`);
        await mongoose.disconnect();
        process.exit(1);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log(`✅ Password reset for "${user.email}" (role: ${user.role}).`);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
});