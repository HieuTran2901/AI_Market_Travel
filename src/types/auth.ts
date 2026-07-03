export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
  isProvider: boolean;
  businessType?: string;
  businessName?: string;
  address?: string;
  taxCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}
