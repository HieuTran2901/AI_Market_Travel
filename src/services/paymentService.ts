import api from './api';
import { ApiResponse } from '@/types';
import { Payment, PaymentMethod, Refund, Settlement } from '@/types/payment';

export const paymentService = {
  async createPayment(orderId: number, paymentMethod: PaymentMethod, idempotencyKey: string) {
    const response = await api.post<ApiResponse<Payment>>('/payments', {
      orderId,
      paymentMethod,
      idempotencyKey,
    });
    return response.data;
  },

  async getPayment(id: number) {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
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
};

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
