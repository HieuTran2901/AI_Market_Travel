export interface ProviderProfile {
  id: number;
  businessName: string;
  businessType: 'HOTEL' | 'TOUR' | 'RESTAURANT' | 'VEHICLE' | 'EXPERIENCE';
  address: string;
  taxCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roles: string[];
  providerProfile?: ProviderProfile;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  errors?: Record<string, string>;
  timestamp: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
