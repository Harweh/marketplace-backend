import { Schema, model, Document, Types } from "mongoose";
import { VendorStatus } from "../config/constants.js";

export interface IVendor extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    storeName: string;
    storeSlug: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    status: VendorStatus;
    verificationDocs: string[];
    commissionRate: number;
    location?: {
        address: string;
        city: string;
        state: string;
        lat: number;
        lng: number;
    };
    payoutAccount: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
    };
    rating: {
        average: number;
        count: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        storeName: { type: String, required: true, trim: true },
        storeSlug: { type: String, required: true, unique: true, lowercase: true },
        description: { type: String },
        logoUrl: { type: String },
        bannerUrl: { type: String },
        status: {
        type: String,
        enum: Object.values(VendorStatus),
        default: VendorStatus.PENDING,
        },
        verificationDocs: [{ type: String }],
        commissionRate: { type: Number, default: 10 },
        location: {
        address: { type: String },
        city: { type: String },
        state: { type: String },
        lat: { type: Number },
        lng: { type: Number },
        },
        payoutAccount: {
        bankName: String,
        accountNumber: String,
        accountName: String,
        },
        rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);


vendorSchema.index({ status: 1 });

export const Vendor = model<IVendor>("Vendor", vendorSchema);