import api from './api';
import { ApiResponse } from '@/types';
import { 
  ProviderProfileResponse, 
  ProviderRegisterRequest, 
  ProviderUpdateRequest 
} from '@/types/provider';

export const providerService = {
  // Provider self-service
  registerAsProvider: async (data: ProviderRegisterRequest) => {
    const response = await api.post<ApiResponse<ProviderProfileResponse>>('/provider/register', data);
    return response.data;
  },

  getMyProfile: async () => {
    const response = await api.get<ApiResponse<ProviderProfileResponse>>('/provider/me');
    return response.data;
  },

  updateMyProfile: async (data: ProviderUpdateRequest) => {
    const response = await api.put<ApiResponse<ProviderProfileResponse>>('/provider/me', data);
    return response.data;
  },

  // Public
  getPublicProfile: async (id: number) => {
    const response = await api.get<ApiResponse<ProviderProfileResponse>>(`/provider/${id}`);
    return response.data;
  }
};
