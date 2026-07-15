import api from './api';
import { ApiResponse, PageResponse } from '@/types';
import { AdminUser, AdminUserSearchParams, AdminUserStatistics, BanUserRequest } from '@/types/adminUser';

export const adminUserService = {
  async getUsers(params: AdminUserSearchParams) {
    const response = await api.get<ApiResponse<PageResponse<AdminUser>>>('/admin/users', { params });
    return response.data;
  },

  async getStatistics() {
    const response = await api.get<ApiResponse<AdminUserStatistics>>('/admin/users/statistics');
    return response.data;
  },

  async banUser(userId: number, request: BanUserRequest) {
    const response = await api.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/ban`, request);
    return response.data;
  },

  async unbanUser(userId: number) {
    const response = await api.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/unban`);
    return response.data;
  },
};
