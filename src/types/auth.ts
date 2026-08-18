export type OtpPurpose = 'REGISTER' | 'LOGIN' | 'PASSWORD_RESET';

export interface SendOtpRequest {
  email: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpRequest {
  email: string;
  purpose: OtpPurpose;
  code: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
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
