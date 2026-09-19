// import { env } from "./env.js";

// export interface Coordinates {
//     lat: number;
//     lng: number;
// }

// // Turns a free-text address into coordinates. Used once when a vendor
// // sets their store address, and once per checkout for the buyer's
// // shipping address — cheap (well within Google's free monthly credit)
// // since it's not called on every page view.
// export async function geocodeAddress(address: string): Promise<Coordinates | null> {
//     const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
//     url.searchParams.set("address", address);
//     url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

//     const res = await fetch(url.toString());
//     const json = await res.json();

//     if (json.status !== "OK" || !json.results?.[0]) {
//         return null;
//     }

//     const { lat, lng } = json.results[0].geometry.location;
//     return { lat, lng };
// }

// // Straight-line (great-circle) distance between two coordinates, in km.
// // Computed locally — no extra API call or cost, since we already have
// // both points from geocoding.
// export function distanceKm(a: Coordinates, b: Coordinates): number {
//     const R = 6371; // Earth's radius in km
//     const dLat = ((b.lat - a.lat) * Math.PI) / 180;
//     const dLng = ((b.lng - a.lng) * Math.PI) / 180;
//     const lat1 = (a.lat * Math.PI) / 180;
//     const lat2 = (b.lat * Math.PI) / 180;

//     const h =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
//     const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

//     return R * c;
// }

// // Simple, transparent shipping formula: a base handling fee plus a
// // per-kilometer rate. Easy to tune later once real order data shows
// // what's sustainable.
// const BASE_SHIPPING_FEE = 2;
// const PER_KM_RATE = 0.15;

// export function calculateShippingFee(km: number): number {
//     return Math.round((BASE_SHIPPING_FEE + km * PER_KM_RATE) * 100) / 100;
// }





// export interface Coordinates {
//     lat: number;
//     lng: number;
// }

// // Uses OpenStreetMap's free Nominatim geocoding service — no API key,
// // no card, no billing account required. Fair-use policy: max 1 request
// // per second, and a descriptive User-Agent is required (they'll block
// // requests without one).
// export async function geocodeAddress(address: string): Promise<Coordinates | null> {
//     const url = new URL("https://nominatim.openstreetmap.org/search");
//     url.searchParams.set("q", address);
//     url.searchParams.set("format", "json");
//     url.searchParams.set("limit", "1");

//     const res = await fetch(url.toString(), {
//         headers: {
//         // Required by Nominatim's usage policy — identifies the app.
//         "User-Agent": "AweMarketplace/1.0 (contact: support@awemarketplace.com)",
//         },
//     });

//     const json = await res.json();
//     if (!Array.isArray(json) || json.length === 0) {
//         return null;
//     }

//     return {
//         lat: parseFloat(json[0].lat),
//         lng: parseFloat(json[0].lon),
//     };
// }

// // Straight-line (great-circle) distance between two coordinates, in km.
// export function distanceKm(a: Coordinates, b: Coordinates): number {
//     const R = 6371;
//     const dLat = ((b.lat - a.lat) * Math.PI) / 180;
//     const dLng = ((b.lng - a.lng) * Math.PI) / 180;
//     const lat1 = (a.lat * Math.PI) / 180;
//     const lat2 = (b.lat * Math.PI) / 180;

//     const h =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
//     const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

//     return R * c;
// }

// const BASE_SHIPPING_FEE = 2;
// const PER_KM_RATE = 0.15;

// export function calculateShippingFee(km: number): number {
//     return Math.round((BASE_SHIPPING_FEE + km * PER_KM_RATE) * 100) / 100;
// }




// export interface Coordinates {
//     lat: number;
//     lng: number;
// }

// // Uses OpenStreetMap's free Nominatim geocoding service — no API key,
// // no card, no billing account required.
// export async function geocodeAddress(address: string): Promise<Coordinates | null> {
//     try {
//         const url = new URL("https://nominatim.openstreetmap.org/search");
//         url.searchParams.set("q", address);
//         url.searchParams.set("format", "json");
//         url.searchParams.set("limit", "1");

//         const res = await fetch(url.toString(), {
//         headers: {
//             "User-Agent": "AweMarketplace/1.0 (contact: support@awemarketplace.com)",
//         },
//         });

//         const json = await res.json();
//         if (!Array.isArray(json) || json.length === 0) {
//         return null;
//         }

//         return {
//         lat: parseFloat(json[0].lat),
//         lng: parseFloat(json[0].lon),
//         };
//     } catch (err) {
//         // A network failure here (blocked connection, DNS issue, timeout)
//         // must never crash the whole server — it should just mean "we
//         // couldn't geocode this address," handled as a normal 400 error
//         // by whoever called this, not an unhandled process-level crash.
//         console.error("Geocoding request failed:", err);
//         return null;
//     }
// }

// // Straight-line (great-circle) distance between two coordinates, in km.
// export function distanceKm(a: Coordinates, b: Coordinates): number {
//     const R = 6371;
//     const dLat = ((b.lat - a.lat) * Math.PI) / 180;
//     const dLng = ((b.lng - a.lng) * Math.PI) / 180;
//     const lat1 = (a.lat * Math.PI) / 180;
//     const lat2 = (b.lat * Math.PI) / 180;

//     const h =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
//     const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

//     return R * c;
// }

// const BASE_SHIPPING_FEE = 2;
// const PER_KM_RATE = 0.15;

// export function calculateShippingFee(km: number): number {
//     return Math.round((BASE_SHIPPING_FEE + km * PER_KM_RATE) * 100) / 100;
// }


import { env } from "./env.js";

export interface Coordinates {
    lat: number;
    lng: number;
}

// LocationIQ — free tier (5,000 requests/day), no card required, backed
// by real API-key auth instead of Nominatim's public fair-use endpoint
// (which aggressively rate-limits/blocks IPs it doesn't recognize).
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
        const url = new URL("https://us1.locationiq.com/v1/search");
        url.searchParams.set("key", env.LOCATIONIQ_API_KEY);
        url.searchParams.set("q", address);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "1");

        const res = await fetch(url.toString());
        const json = await res.json();

        if (!Array.isArray(json) || json.length === 0) {
        return null;
        }

        return {
        lat: parseFloat(json[0].lat),
        lng: parseFloat(json[0].lon),
        };
    } catch (err) {
        // A network failure here must never crash the whole server — just
        // means "we couldn't geocode this address," handled as a normal
        // 400 error, not an unhandled process-level crash.
        console.error("Geocoding request failed:", err);
        return null;
    }
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
    const R = 6371;
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

const BASE_SHIPPING_FEE = 2;
const PER_KM_RATE = 0.15;

export function calculateShippingFee(km: number): number {
    return Math.round((BASE_SHIPPING_FEE + km * PER_KM_RATE) * 100) / 100;
}