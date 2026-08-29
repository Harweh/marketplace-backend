import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        link: { type: String },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", notificationSchema);