// Turns "Blue Cotton T-Shirt" into "blue-cotton-t-shirt".
// A random suffix is appended by the caller when uniqueness needs guaranteeing
// (e.g. two sellers both naming a product "Red Bag").
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-");
}

export function randomSuffix(length = 6): string {
    return Math.random().toString(36).substring(2, 2 + length);
}