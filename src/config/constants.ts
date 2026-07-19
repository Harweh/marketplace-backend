// Roles mirror PRD section 3.1 (User Roles and Personas).
export enum Role {
    BUYER = "buyer",
    SELLER = "seller",
    ADMIN = "admin",
    SUPPORT = "support",
    SUPER_ADMIN = "super_admin",
}

// Order lifecycle stages, matching PRD FR-4.1.
export enum OrderStatus {
    PLACED = "placed",
    CONFIRMED = "confirmed",
    PACKED = "packed",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    RETURN_REQUESTED = "return_requested",
    REFUNDED = "refunded",
}

// Vendor approval workflow, matching PRD FR-5.1 / FR-6.2.
export enum VendorStatus {
    PENDING = "pending",
    APPROVED = "approved",
    SUSPENDED = "suspended",
    REJECTED = "rejected",
}

// Product moderation queue, matching PRD FR-2.6.
export enum ProductStatus {
    PENDING_REVIEW = "pending_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    DELISTED = "delisted",
}

export enum PayoutStatus {
    HELD = "held",       // escrow, matching PRD FR-4.6
    RELEASED = "released",
    FAILED = "failed",
}