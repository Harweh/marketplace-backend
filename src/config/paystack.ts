import { env } from "./env.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface InitializeResult {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
}

// Starts a Paystack transaction. Amount must be passed in Naira — this
// function converts to kobo (Paystack's base unit) internally.
export async function initializeTransaction(
    email: string,
    amountNaira: number,
    reference: string,
    callbackUrl: string
): Promise<InitializeResult> {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        email,
        amount: Math.round(amountNaira * 100),
        reference,
        callback_url: callbackUrl,
        }),
    });

    const json = await res.json();
    if (!json.status) {
        throw new Error(json.message ?? "Failed to initialize Paystack transaction");
    }

    return {
        authorizationUrl: json.data.authorization_url,
        accessCode: json.data.access_code,
        reference: json.data.reference,
    };
}

interface VerifyResult {
    status: "success" | "failed" | "abandoned" | string;
    amountKobo: number;
    reference: string;
}

// Confirms a transaction actually went through — never trust the
// frontend's word alone that payment succeeded.
export async function verifyTransaction(reference: string): Promise<VerifyResult> {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
    });

    const json = await res.json();
    if (!json.status) {
        throw new Error(json.message ?? "Failed to verify Paystack transaction");
    }

    return {
        status: json.data.status,
        amountKobo: json.data.amount,
        reference: json.data.reference,
    };
}