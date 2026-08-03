import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, TokenResponse } from '@/types';

// Extend AxiosRequestConfig to include _retry property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach Access Token if available
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 and attempt refresh token rotation
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    // Check if error status is 401 and request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Attempt token rotation
          const response = await axios.post<ApiResponse<TokenResponse>>('/api/v1/auth/refresh', {
            refreshToken,
          });

          if (response.data?.success && response.data.data) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
            
            localStorage.setItem('access_token', newAccessToken);
            localStorage.setItem('refresh_token', newRefreshToken);

            // Update the original request's Authorization header
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }

            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Refresh token expired or invalid, logging out...', refreshError);
          // Token refresh failed, perform logout cleanup
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }

      // If we reach here, we're definitely unauthenticated
      window.dispatchEvent(
        new CustomEvent('auth:required', {
          detail: { returnTo: window.location.pathname + window.location.search },
        })
      );
      
      // Return a special error so downstream catch blocks can suppress generic toasts
      return Promise.reject(new Error('AuthenticationRequiredError'));
    }

    // Check for 403 where user is just unauthorized entirely or requires login
    if (
      error.response?.status === 403 &&
      (error.response?.data?.errorCode === 'AUTHENTICATION_REQUIRED' || 
       error.response?.data?.errorCode === 'UNAUTHORIZED' || 
       error.response?.data?.errorCode === 'LOGIN_REQUIRED')
    ) {
      window.dispatchEvent(
        new CustomEvent('auth:required', {
          detail: { returnTo: window.location.pathname + window.location.search },
        })
      );
      return Promise.reject(new Error('AuthenticationRequiredError'));
    }

    // Check for 403 where user lacks role (e.g. Provider access required)
    if (
      error.response?.status === 403 &&
      error.response?.data?.errorCode === 'FORBIDDEN'
    ) {
      window.dispatchEvent(new CustomEvent('provider:required'));
      return Promise.reject(new Error('ProviderAccessRequiredError'));
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
