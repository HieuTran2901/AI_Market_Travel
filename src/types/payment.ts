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
  PAYPAL = 'PAYPAL',
  AI_COINS = 'AI_COINS',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum PaymentPurpose {
  BOOKING = 'BOOKING',
  AI_COIN_PURCHASE = 'AI_COIN_PURCHASE'
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
  orderNumber?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentPurpose?: PaymentPurpose;
  listingTitle?: string;
  listingCoverImageUrl?: string;
  listingCategory?: string;
  gatewayOrderId?: string;
  payUrl?: string;
  aiCoinPackageId?: string;
  aiCoinPackageCode?: string;
  aiCoinPackageName?: string;
  baseCoins?: number;
  bonusCoins?: number;
  totalCoins?: number;
  invoiceNumber?: string;
  providerTransactionId?: string;
  paidAt?: string;
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
  extrasAmount?: number;
  serviceFee: number;
  tax: number;
  discount: number;
  finalTotal: number;
  coinSubtotal?: number;
  coinExtrasAmount?: number;
  coinServiceFee?: number;
  coinTax?: number;
  coinDiscount?: number;
  coinFinalTotal?: number;
}

export interface CartItemExtra {
  id: number;
  extraServiceId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  pricingUnit: string;
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
  selectedExtras?: CartItemExtra[];
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

export interface PaymentBookingSummary {
  bookingId?: number;
  listingId?: number;
  listingTitle?: string;
  listingType?: string;
  listingLocation?: string;
  averageRating?: number;
  reviewCount?: number;
  roomName?: string;
  roomType?: string;
  imageUrl?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  infants?: number;
  totalGuests?: number;
}

export interface PaymentDetail extends Payment {
  booking?: PaymentBookingSummary;
  priceBreakdown?: PriceBreakdownDto;
  subtotal?: number;
  discountAmount?: number;
  totalPaid?: number;
  isRefundable?: boolean;
  existingRefundId?: number;
}
