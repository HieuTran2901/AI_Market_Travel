export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED'
}

export enum PaymentMethod {
  MOCK = 'MOCK',
  COD = 'COD',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL'
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: number;
  paymentId?: number;
  amount: number;
  reason: string;
  status: RefundStatus;
  refundMethod: string;
  requestedBy?: unknown;
  processedBy?: unknown;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: number;
  providerId?: number;
  grossAmount: number;
  platformFee: number;
  providerAmount: number;
  taxAmount: number;
  currency: string;
  status: SettlementStatus;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceBreakdownDto {
  basePrice: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  discount: number;
  finalTotal: number;
}

export interface CartItem {
  id: number;
  listingId: number;
  listingTitle: string;
  listingSlug: string;
  listingCoverImageUrl?: string;
  listingCategory: string;
  listingCity?: string;
  listingCountry?: string;
  providerName?: string;
  averageRating?: number;
  reviewCount?: number;
  currency?: string;
  inventoryId?: number;
  inventoryName?: string;
  quantity: number;
  startDate?: string;
  endDate?: string;
  timeSlot?: string;
  basePrice: number;
  priceBreakdown: PriceBreakdownDto;
}

export interface Cart {
  id: number;
  userId: number;
  status: string;
  items: CartItem[];
  totalBreakdown: PriceBreakdownDto;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  status: string;
  priceBreakdown: PriceBreakdownDto;
  bookings: Array<{
    id: number;
    bookingNumber: string;
    status: string;
    listingTitle: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
