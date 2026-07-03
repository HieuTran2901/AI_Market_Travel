import api from './api';
import { ApiResponse } from '@/types';
import { Cart, Order } from '@/types/payment';

export interface CartItemRequest {
  listingId: number;
  inventoryId?: number;
  quantity: number;
  startDate?: string;
  endDate?: string;
  timeSlot?: string;
}

export interface AvailabilityCalendar {
  id: number;
  date: string;
  price?: number;
  totalCapacity: number;
  bookedUnits: number;
  reservedUnits: number;
  blockedCapacity: number;
  status: string;
}

export const bookingService = {
  async getCart() {
    const response = await api.get<ApiResponse<Cart>>('/cart');
    return response.data;
  },

  async addCartItem(request: CartItemRequest) {
    const response = await api.post<ApiResponse<Cart>>('/cart/items', request);
    return response.data;
  },

  async removeCartItem(itemId: number) {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return response.data;
  },

  async clearCart() {
    const response = await api.delete<ApiResponse<void>>('/cart');
    return response.data;
  },

  async createOrder(cartItemIds: number[]) {
    const response = await api.post<ApiResponse<Order>>('/orders', {
      items: cartItemIds.map((cartItemId) => ({ cartItemId, guests: [] })),
    });
    return response.data;
  },

  async getAvailability(listingId: number, startDate: string, endDate: string, inventoryId?: number) {
    const response = await api.get<ApiResponse<AvailabilityCalendar[]>>(`/availability/${listingId}`, {
      params: { startDate, endDate, inventoryId },
    });
    return response.data;
  },
};
