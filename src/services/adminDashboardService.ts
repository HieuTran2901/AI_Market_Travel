import api from './api';
import { ApiResponse } from '@/types';
import {
  AdminDashboardBookingsOverview,
  AdminDashboardOverview,
  AdminDashboardRecentBooking,
  AdminDashboardSystemHealth,
  AdminDashboardUserGrowth,
} from '@/types/adminDashboard';

export const adminDashboardService = {
  async getOverview() {
    const response = await api.get<ApiResponse<AdminDashboardOverview>>('/admin/dashboard/overview');
    return response.data;
  },

  async getBookingsOverview(range = '30d') {
    const response = await api.get<ApiResponse<AdminDashboardBookingsOverview>>('/admin/dashboard/bookings-overview', { params: { range } });
    return response.data;
  },

  async getUserGrowth(range = '30d') {
    const response = await api.get<ApiResponse<AdminDashboardUserGrowth>>('/admin/dashboard/user-growth', { params: { range } });
    return response.data;
  },

  async getSystemHealth() {
    const response = await api.get<ApiResponse<AdminDashboardSystemHealth>>('/admin/dashboard/system-health');
    return response.data;
  },

  async getRecentBookings(limit = 5) {
    const response = await api.get<ApiResponse<AdminDashboardRecentBooking[]>>('/admin/dashboard/recent-bookings', { params: { limit } });
    return response.data;
  },
};
