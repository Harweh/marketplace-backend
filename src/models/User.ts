import { Schema, model, Document, Types } from "mongoose";
import { Role } from "../config/constants.js";

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    phone?: string;
    isEmailVerified?: boolean;
    isActive?: boolean;
    vendorProfile?: Types.ObjectId;
    addresses?: {
        label: string;
        line1: string;
        city: string;
        state: string;
        phone?: string;
        isDefault: boolean;
    }[];
    cart?: {
        product: Types.ObjectId;
        quantity: number;
        selectedSku?: string;
    }[];
    wishlist?: Types.ObjectId[];
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: Object.values(Role), default: Role.BUYER },
        phone: { type: String },
        isEmailVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        vendorProfile: { type: Schema.Types.ObjectId, ref: "Vendor" },
        addresses: [
        {
            label: { type: String, default: "Home" },
            line1: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            phone: { type: String },
            isDefault: { type: Boolean, default: false },
        },
        ],
        cart: [
        {
            product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, required: true, min: 1 },
            selectedSku: { type: String },
        },
        ],
        wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        passwordResetToken: { type: String, select: false },
        passwordResetExpires: { type: Date, select: false },
    },
    { timestamps: true }
);

export const User = model<IUser>("User", userSchema);