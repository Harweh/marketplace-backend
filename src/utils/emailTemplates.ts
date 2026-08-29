const wrapper = (bodyHtml: string) => `
<div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #111827; margin-bottom: 16px;">Awe Marketplace</h2>
    ${bodyHtml}
    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">This is an automated message — please don't reply directly to this email.</p>
</div>`;

export function welcomeEmail(name: string) {
    return {
        subject: "Welcome to Awe",
        html: wrapper(`
            <p>Hi ${name},</p>
            <p>Your account has been created. Start browsing and discover products from independent sellers.</p>
        `),
    };
}

export function orderConfirmedEmail(name: string, orderNumber: string, total: number) {
    return {
        subject: `Order Confirmed — #${orderNumber}`,
        html: wrapper(`
            <p>Hi ${name},</p>
            <p>Your payment was successful and your order <strong>#${orderNumber}</strong> has been confirmed.</p>
            <p><strong>Total: ₦${total.toFixed(2)}</strong></p>
            <p>We'll notify you as your order moves through fulfillment.</p>
        `),
    };
}

export function paymentFailedEmail(name: string, orderNumber: string) {
    return {
        subject: `Payment Failed — #${orderNumber}`,
        html: wrapper(`
            <p>Hi ${name},</p>
            <p>We couldn't process payment for order <strong>#${orderNumber}</strong>. No charge was made.</p>
            <p>You can try checking out again from your cart.</p>
        `),
    };
}

export function orderShippedEmail(name: string, orderNumber: string, trackingNumber?: string) {
    return {
        subject: `Order Shipped — #${orderNumber}`,
        html: wrapper(`
            <p>Hi ${name},</p>
            <p>Good news — part of your order <strong>#${orderNumber}</strong> has shipped.</p>
            ${trackingNumber ? `<p>Tracking number: <strong>${trackingNumber}</strong></p>` : ""}
        `),
    };
}

export function orderDeliveredEmail(name: string, orderNumber: string) {
    return {
        subject: `Order Delivered — #${orderNumber}`,
        html: wrapper(`
            <p>Hi ${name},</p>
            <p>Your order <strong>#${orderNumber}</strong> has been marked as delivered. We hope you love it!</p>
            <p>Had an issue? You can request a return from your order history.</p>
        `),
    };
}

export function newOrderSellerEmail(storeName: string, orderNumber: string, itemCount: number) {
    return {
        subject: `New Order Received — #${orderNumber}`,
        html: wrapper(`
            <p>Hi ${storeName},</p>
            <p>You've received a new order <strong>#${orderNumber}</strong> with ${itemCount} item(s).</p>
            <p>Log in to your seller dashboard to confirm and fulfill it.</p>
        `),
    };
}

export function returnRequestedSellerEmail(storeName: string, orderNumber: string, reason: string) {
    return {
        subject: `Return Requested — #${orderNumber}`,
        html: wrapper(`
            <p>Hi ${storeName},</p>
            <p>A buyer has requested a return for order <strong>#${orderNumber}</strong>.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>An admin will review this request.</p>
        `),
    };
}

export function returnApprovedEmail(name: string, orderNumber: string) {
    return {
        subject: `Return Approved — #${orderNumber}`,
        html: wrapper(`
            <p>Hi ${name},</p>
            <p>Your return request for order <strong>#${orderNumber}</strong> has been approved. A refund has been initiated.</p>
        `),
    };
}

export function returnRejectedEmail(name: string, orderNumber: string, note?: string) {
    return {
        subject: `Return Request Update — #${orderNumber}`,
        html: wrapper(`
            <p>Hi ${name},</p>
            <p>Your return request for order <strong>#${orderNumber}</strong> was not approved.</p>
            ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
        `),
    };
}

export function passwordResetEmail(name: string, resetLink: string) {
    return {
        subject: "Reset Your Password",
        html: wrapper(`
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click below to choose a new one — this link expires in 1 hour.</p>
            <p><a href="${resetLink}" style="display: inline-block; background: #111827; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">Reset Password</a></p>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">If you didn't request this, you can safely ignore this email.</p>
        `),
    };
}