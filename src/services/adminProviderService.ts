import api from './api';
import { ApiResponse, PageResponse } from '@/types';
import {
  AdminProvider,
  AdminProviderCategoryDistribution,
  AdminProviderGrowth,
  AdminProviderSearchParams,
  AdminProviderStatistics,
} from '@/types/adminProvider';
import { ProviderProfileResponse } from '@/types/provider';

export const adminProviderService = {
  async getProviders(params: AdminProviderSearchParams) {
    const response = await api.get<ApiResponse<PageResponse<AdminProvider>>>('/admin/providers', { params });
    return response.data;
  },

  async getStatistics() {
    const response = await api.get<ApiResponse<AdminProviderStatistics>>('/admin/providers/statistics');
    return response.data;
  },

  async getGrowth(range = '30d') {
    const response = await api.get<ApiResponse<AdminProviderGrowth>>('/admin/providers/growth', { params: { range } });
    return response.data;
  },

  async getCategoryDistribution() {
    const response = await api.get<ApiResponse<AdminProviderCategoryDistribution[]>>('/admin/providers/categories');
    return response.data;
  },

  async getTopRated(limit = 5) {
    const response = await api.get<ApiResponse<AdminProvider[]>>('/admin/providers/top-rated', { params: { limit } });
    return response.data;
  },

  async verifyProvider(id: number) {
    const response = await api.patch<ApiResponse<ProviderProfileResponse>>(`/admin/providers/${id}/verify`);
    return response.data;
  },

  async rejectProvider(id: number, reason: string) {
    const response = await api.patch<ApiResponse<ProviderProfileResponse>>(`/admin/providers/${id}/reject`, undefined, { params: { reason } });
    return response.data;
  },

  async suspendProvider(id: number, reason?: string) {
    const response = await api.patch<ApiResponse<ProviderProfileResponse>>(`/admin/providers/${id}/suspend`, undefined, { params: { reason } });
    return response.data;
  },

  async reactivateProvider(id: number) {
    const response = await api.patch<ApiResponse<ProviderProfileResponse>>(`/admin/providers/${id}/reactivate`);
    return response.data;
  },
};
