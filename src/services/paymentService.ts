import api from './api';
import { ApiResponse } from '@/types';
import { Payment, PaymentDetail, PaymentMethod, Refund, Settlement } from '@/types/payment';

export const paymentService = {
  async createPayment(orderId: number, paymentMethod: PaymentMethod, idempotencyKey: string) {
    const response = await api.post<ApiResponse<Payment>>('/payments', {
      orderId,
      paymentMethod,
      idempotencyKey,
    });
    return response.data;
  },

  async purchaseAiCoins(payload: {
    packageId: string;
    packageCode: string;
    coinAmount: number;
    bonusCoins: number;
    amount: number;
    paymentMethod: PaymentMethod;
    promoCode: string | null;
    purpose: string;
  }) {
    const response = await api.post<ApiResponse<any>>('/ai-coins/purchases/payments', {
      packageId: payload.packageId,
      paymentMethod: payload.paymentMethod,
      promoCode: payload.promoCode,
      idempotencyKey: crypto.randomUUID()
    });
    return response.data;
  },

  async getPayment(id: number) {
    const response = await api.get<ApiResponse<PaymentDetail>>(`/payments/${id}`);
    return response.data;
  },

  async getMomoPaymentStatus(orderId: string) {
    const response = await api.get<ApiResponse<Payment>>('/payments/momo/status', {
      params: { orderId },
    });
    return response.data;
  },

  async getMyPayments() {
    const response = await api.get<ApiResponse<Payment[]>>('/payments');
    return response.data;
  },

  async cancelPayment(id: number) {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/cancel`);
    return response.data;
  },

  async getAiCoinPaymentStatus(paymentId: number, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<AiCoinPaymentStatusResponse>>(
      `/ai-coins/payments/${paymentId}/status`,
      { signal }
    );
    return response.data;
  },

  async processMoMoReturn(payload: {
    paymentId: number;
    orderId?: string;
    requestId?: string;
    resultCode?: number;
    message?: string;
    transId?: number;
    amount?: number;
    extraData?: string;
  }) {
    const response = await api.post<ApiResponse<AiCoinPaymentStatusResponse>>(
      '/ai-coins/payments/momo/return',
      payload
    );
    return response.data;
  },
};

export interface AiCoinPaymentStatusResponse {
  paymentId: number;
  purchaseId: number;
  status: string;
  purchaseStatus: string;
  credited: boolean;
  amount: number;
  currency: string;
  gatewayResultCode: number | null;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  updatedAt: string;
}

export const refundService = {
  async requestRefund(paymentId: number, amount: number, reason: string, method: string, requestedBy?: number) {
    const response = await api.post<ApiResponse<Refund>>('/refunds', null, {
      params: { paymentId, amount, reason, method, requestedBy },
    });
    return response.data;
  },

  async getRefundsByPayment(paymentId: number) {
    const response = await api.get<ApiResponse<Refund[]>>(`/refunds/payment/${paymentId}`);
    return response.data;
  },

  async getRefund(id: number) {
    const response = await api.get<ApiResponse<Refund>>(`/refunds/${id}`);
    return response.data;
  },
};

export const settlementService = {
  async getSettlementsByProvider(providerId: number) {
    const response = await api.get<ApiResponse<Settlement[]>>(`/settlements/provider/${providerId}`);
    return response.data;
  },
};
