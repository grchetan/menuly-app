/**
 * Types for Menuly E-Commerce Shop & Merchandise System
 */

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null | undefined;
  badge?: string | undefined;
  image: string;
  inStock: boolean;
  rating?: number | undefined;
  reviewsCount?: number | undefined;
  features?: string[] | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ShopReview {
  id: string;
  productId: string;
  orderId?: string | undefined;
  userId: string;
  userName: string;
  rating: number; // 1 to 5 stars
  title?: string | undefined;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface ShopCartItem {
  product: ShopProduct;
  quantity: number;
}

export type ShopOrderStatus = "PLACED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type ShopPaymentMode = "COD" | "UPI" | "ONLINE";

export interface ShopShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | undefined;
}

export interface ShopOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  total: number;
}

export interface ShopOrder {
  id: string;
  orderNumber: string; // e.g. "MNL-SHOP-8392"
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | undefined;
  shippingAddress: ShopShippingAddress;
  items: ShopOrderItem[];
  subtotal: number;
  deliveryFee: number; // Flat ₹80 COD / Delivery fee
  grandTotal: number;
  paymentMode: ShopPaymentMode;
  upiUtr?: string | undefined;
  status: ShopOrderStatus;
  trackingNumber?: string | undefined;
  courierPartner?: string | undefined;
  notes?: string | undefined;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string | undefined;
}
