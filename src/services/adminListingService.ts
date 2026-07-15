import api from './api';
import { ApiResponse, PageResponse } from '@/types';
import {
  AdminListing,
  AdminListingPerformance,
  AdminListingSearchParams,
  AdminListingStatistics,
  AdminListingTopProvider,
} from '@/types/adminListing';
import { ListingResponse } from '@/types/listing';

export const adminListingService = {
  async getListings(params: AdminListingSearchParams) {
    const response = await api.get<ApiResponse<PageResponse<AdminListing>>>('/admin/listings', { params });
    return response.data;
  },

  async getStatistics() {
    const response = await api.get<ApiResponse<AdminListingStatistics>>('/admin/listings/statistics');
    return response.data;
  },

  async getPerformance(range = '30d') {
    const response = await api.get<ApiResponse<AdminListingPerformance>>('/admin/listings/performance', { params: { range } });
    return response.data;
  },

  async getTopProviders(limit = 5) {
    const response = await api.get<ApiResponse<AdminListingTopProvider[]>>('/admin/listings/top-providers', { params: { limit } });
    return response.data;
  },

  async getRecentSubmissions(limit = 5) {
    const response = await api.get<ApiResponse<AdminListing[]>>('/admin/listings/recent-submissions', { params: { limit } });
    return response.data;
  },

  async approve(id: number) {
    const response = await api.patch<ApiResponse<ListingResponse>>(`/admin/listings/${id}/approve`);
    return response.data;
  },

  async reject(id: number, reason: string) {
    const response = await api.patch<ApiResponse<ListingResponse>>(`/admin/listings/${id}/reject`, undefined, { params: { reason } });
    return response.data;
  },

  async suspend(id: number, reason: string) {
    const response = await api.patch<ApiResponse<ListingResponse>>(`/admin/listings/${id}/suspend`, undefined, { params: { reason } });
    return response.data;
  },

  async reactivate(id: number) {
    const response = await api.patch<ApiResponse<ListingResponse>>(`/admin/listings/${id}/reactivate`);
    return response.data;
  },
};
