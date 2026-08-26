import { Schema, model, Document, Types } from "mongoose";
import { OrderStatus } from "../config/constants.js";

interface IOrderItem {
    product: Types.ObjectId;
    sku?: string;
    title: string;
    price: number;
    quantity: number;
}

interface ISubOrder {
    vendor: Types.ObjectId;
    items: IOrderItem[];
    subtotal: number;
    shippingFee: number;
    status: OrderStatus;
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
    payout: {
        amount: number;
        commission: number;
        status: "held" | "released" | "failed";
        releasedAt?: Date;
    };
}

export interface IOrder extends Document {
    _id: Types.ObjectId;
    orderNumber: string;
    buyer: Types.ObjectId;
    subOrders: ISubOrder[];
    totalAmount: number;
    shippingAddress: {
        line1: string;
        city: string;
        state: string;
        phone: string;
    };
    paymentReference: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
    {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        sku: { type: String },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const subOrderSchema = new Schema<ISubOrder>({
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PLACED,
    },
    trackingNumber: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    payout: {
        amount: { type: Number, required: true },
        commission: { type: Number, required: true },
        status: { type: String, enum: ["held", "released", "failed"], default: "held" },
        releasedAt: { type: Date },
    },
});

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        subOrders: [subOrderSchema],
        totalAmount: { type: Number, required: true },
        shippingAddress: {
        line1: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        phone: { type: String, required: true },
        },
        paymentReference: { type: String, required: true },
        paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
        },
    },
    { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ "subOrders.vendor": 1 });
orderSchema.index({ paymentReference: 1 });

export const Order = model<IOrder>("Order", orderSchema);