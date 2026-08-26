import { env } from "./env.js";

export interface Coordinates {
    lat: number;
    lng: number;
}

// Turns a free-text address into coordinates. Used once when a vendor
// sets their store address, and once per checkout for the buyer's
// shipping address — cheap (well within Google's free monthly credit)
// since it's not called on every page view.
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

    const res = await fetch(url.toString());
    const json = await res.json();

    if (json.status !== "OK" || !json.results?.[0]) {
        return null;
    }

    const { lat, lng } = json.results[0].geometry.location;
    return { lat, lng };
}

// Straight-line (great-circle) distance between two coordinates, in km.
// Computed locally — no extra API call or cost, since we already have
// both points from geocoding.
export function distanceKm(a: Coordinates, b: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return R * c;
}

// Simple, transparent shipping formula: a base handling fee plus a
// per-kilometer rate. Easy to tune later once real order data shows
// what's sustainable.
const BASE_SHIPPING_FEE = 2;
const PER_KM_RATE = 0.15;

export function calculateShippingFee(km: number): number {
    return Math.round((BASE_SHIPPING_FEE + km * PER_KM_RATE) * 100) / 100;
}