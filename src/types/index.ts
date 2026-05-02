export interface Review {
  id: string;
  userId?: string;
  name: string;
  comment: string;
  rating: number;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  originalPrice?: number;
  discount: number;
  finalPrice: number;
  images: string[];
  category: string; // Internal key (e.g., 'appliances', 'kitchen')
  categoryAr?: string; // Optional display name
  isOffer: boolean;
  isNew?: boolean;
  isFeatured: boolean;
  rating: number; // Existing field (optional legacy support)
  reviewCount: number; // Existing field (optional legacy support)
  ratingAverage: number; // NEW: Detailed rating
  ratingCount: number; // NEW: Total number of ratings
  reviews: Review[]; // NEW: List of reviews
  shippingDetails?: string; // NEW: Shipping information
  warranty?: string; // NEW: Warranty information
  returnPolicy?: string; // NEW: Return policy
  stock: number;
  sku: string;
  brand?: string;
  condition?: 'new' | 'used' | 'refurbished';
  color?: string;
  attributes?: Record<string, string | number>;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Coupon {
  id?: string;
  userId: string;
  email: string;
  phone: string;
  code: string;
  discount: number;
  isUsed: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  avatar?: string;
  email: string;
  phone: string;
  location: UserLocation;
  role: 'user' | 'admin' | 'owner';
  language?: 'ar' | 'en';
  theme?: 'light' | 'dark';
  coupon?: string;
  hasUsedCoupon: boolean;
  createdAt: string;
}


export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: UserLocation | null;
  password?: string;
  confirmPassword?: string;
}

export type OrderStatusType = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'vodafone_cash' | 'card';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  customerName?: string;
  items: OrderItem[];
  totalPrice: number;
  shippingCost: number;
  status: OrderStatusType;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  address: string;
  phone: string;
  location?: UserLocation;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  productCount: number;
  slug: string;
}

export interface ProductFilters {
  category?: string;
  brand?: string[];
  color?: string[];
  condition?: string[];
  rating?: number;
  minPrice?: number;
  maxPrice?: number;
  attributes?: Record<string, string[]>;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  governorate: string;
  notes?: string;
  paymentMethod: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  discountPercentage: number;
  productIds: string[];
  category?: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface Lead {
  id?: string;
  phone: string;
  createdAt: string;
  source: string;
}

