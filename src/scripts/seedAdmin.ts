// One-time bootstrap script: promotes an existing user (or creates a new
// one) to super_admin. Run this ONCE to create your very first admin —
// after that, admins can promote other users through the app itself
// (see userController.updateUserRole).
//
// Usage:
//   npx tsx src/scripts/seedAdmin.ts admin@example.com "Admin Name" "SomePassword123"
//
// If a user with that email already exists, it just promotes their role
// and ignores the name/password args. If not, it creates a fresh account.

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Role } from "../config/constants.js";

async function run() {
    const [, , email, name, password] = process.argv;

    if (!email) {
        console.error("Usage: npx tsx src/scripts/seedAdmin.ts <email> [name] [password]");
        process.exit(1);
    }

    await mongoose.connect(env.MONGODB_URI);

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
        existing.role = Role.SUPER_ADMIN;
        await existing.save();
        console.log(`✅ Promoted existing user "${existing.email}" to super_admin.`);
    } else {
        if (!name || !password) {
        console.error("User does not exist yet — you must provide a name and password to create one.");
        console.error('Usage: npx tsx src/scripts/seedAdmin.ts <email> "<name>" "<password>"');
        process.exit(1);
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: Role.SUPER_ADMIN,
        isEmailVerified: true,
        });
        console.log(`✅ Created new super_admin account "${user.email}".`);
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});