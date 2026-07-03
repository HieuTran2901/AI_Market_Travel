import api from './api';
import { ApiResponse, TokenResponse, User } from '@/types';
import { LoginRequest, RegisterRequest } from '@/types/auth';

export const authService = {
  async signup(data: RegisterRequest): Promise<ApiResponse<string>> {
    const response = await api.post<ApiResponse<string>>('/auth/signup', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<ApiResponse<TokenResponse>> {
    const response = await api.post<ApiResponse<TokenResponse>>('/auth/login', data);
    return response.data;
  },

  async logout(): Promise<ApiResponse<string>> {
    const response = await api.post<ApiResponse<string>>('/auth/logout');
    return response.data;
  },

  async me(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  }
};
export default authService;
