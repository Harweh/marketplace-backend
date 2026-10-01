// ─── Shared enums (mirror backend src/config/constants.ts) ───
export type Role = 'buyer' | 'seller' | 'admin' | 'support' | 'super_admin'

export type ProductStatus = 'pending_review' | 'approved' | 'rejected' | 'delisted'

export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected'

export type OrderStatus =
    | 'placed'
    | 'confirmed'
    | 'packed'
    | 'shipped'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'return_requested'
    | 'refunded'

// ─── API envelope (every backend response is wrapped like this) ───
export interface ApiSuccess<T> {
    success: true
    data: T
}

export interface ApiFailure {
    success: false
    error: {
        message: string
        details?: unknown
    }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

// ─── Category (real hierarchical model — GET /api/categories) ───
export interface Category {
    _id: string
    name: string
    slug: string
    parentCategory?: string
    isActive: boolean
}

// ─── Vendor (model exists on backend; no routes yet, kept for later) ───
export interface Vendor {
    _id: string
    user: string
    storeName: string
    storeSlug: string
    description?: string
    logoUrl?: string
    bannerUrl?: string
    status: VendorStatus
    commissionRate: number
    rating: {
        average: number
        count: number
    }
}

// A product's vendor field is just an id string in list responses,
// but populated to this shape on the single-product detail endpoint.
export type VendorRef = string | Pick<Vendor, '_id' | 'storeName' | 'storeSlug' | 'rating'>

// ─── Product (mirrors backend src/models/Product.ts exactly) ───
export interface ProductVariant {
    sku: string
    // Arbitrary key/value pairs, e.g. { color: 'Red', size: 'M' }.
    attributes: Record<string, string>
    price: number
    stock: number
}

export interface Product {
    _id: string
    vendor: VendorRef
    title: string
    slug: string
    description: string
    // Soft reference to Category.slug, not a populated ObjectId (see project tracker).
    category: string
    images: string[]
    basePrice: number
    hasVariants: boolean
    variants: ProductVariant[]
    totalStock: number
    status: ProductStatus
    rejectionReason?: string
    isReturnable: boolean
    returnWindowDays: number
    createdAt: string
    updatedAt: string
}

// Response shape of GET /api/products
export interface PaginatedProducts {
    products: Product[]
    total: number
    page: number
    pages: number
}

// ─── User / Auth (mirrors backend auth controller responses) ───
export interface User {
    id: string
    name: string
    email: string
    role: Role
    phone?: string
}

export interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string, phone?: string) => Promise<void>
    logout: () => void
    fetchMe: () => Promise<void>
    refreshAccessToken: () => Promise<void>
}

// ─── Cart Types ───
// Cart stays entirely client-side for now — the backend has no Cart model
// or routes yet (see project tracker, Section 6). Variant selection now
// keys off a SKU rather than separate color/size strings, since the
// backend prices and stocks each variant combination independently.
export interface CartItem {
    product: Product
    quantity: number
    selectedSku?: string
}

export interface CartState {
    items: CartItem[]
    addItem: (product: Product, quantity?: number, sku?: string) => void
    removeItem: (productId: string, sku?: string) => void
    updateQuantity: (productId: string, quantity: number, sku?: string) => void
    clearCart: () => void
    getTotalPrice: () => number
    getTotalItems: () => number
}

// ─── Wishlist Types ───
export interface WishlistState {
    items: Product[]
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    isInWishlist: (productId: string) => boolean
}

// ─── Filter Types ───
export interface FilterState {
    category: string | null
    priceRange: [number, number]
    sortBy: 'newest' | 'price-asc' | 'price-desc' | 'popular'
    searchQuery: string
}

// ─── Form Types ───
export interface LoginFormData {
    email: string
    password: string
}

export interface RegisterFormData {
    name: string
    email: string
    password: string
    confirmPassword: string
    phone?: string
}

export interface ReviewFormData {
    rating: number
    comment: string
    name: string
    email: string
}