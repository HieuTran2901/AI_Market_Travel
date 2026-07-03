export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BusinessType = 'INDIVIDUAL' | 'COMPANY' | 'AGENCY';

export interface ProviderProfileResponse {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  
  businessName: string;
  businessType: BusinessType;
  description?: string;
  
  address: string;
  city: string;
  country: string;
  phone?: string;
  website?: string;
  
  taxCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ProviderRegisterRequest {
  businessName: string;
  businessType: BusinessType;
  description?: string;
  address: string;
  city: string;
  country?: string;
  phone?: string;
  website?: string;
  taxCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export interface ProviderUpdateRequest extends Partial<ProviderRegisterRequest> {}
