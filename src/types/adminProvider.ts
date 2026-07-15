export type AdminProviderCategory = 'HOTEL' | 'TOUR' | 'RESTAURANT' | 'VEHICLE' | 'EXPERIENCE' | 'OTHER';
export type AdminProviderStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED' | 'INACTIVE';
export type AdminProviderVerificationStatus = 'APPROVED' | 'PENDING' | 'SUSPENDED' | 'REJECTED';

export interface AdminProvider {
  id: number;
  userId?: number;
  businessName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  serviceCategory: AdminProviderCategory | string;
  status: AdminProviderStatus | string;
  verificationStatus: AdminProviderVerificationStatus | string;
  rating?: number;
  reviewCount: number;
  bookingCount: number;
  activeListingCount: number;
  createdAt: string;
  lastActiveAt?: string;
}

export interface AdminProviderStatistics {
  totalProviders: number;
  activeProviders: number;
  newProvidersLast30Days: number;
  verifiedProviders: number;
  suspendedProviders: number;
  pendingProviders: number;
}

export interface AdminProviderCategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface AdminProviderGrowthPoint {
  date: string;
  count: number;
}

export interface AdminProviderGrowth {
  range: string;
  points: AdminProviderGrowthPoint[];
}

export interface AdminProviderSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  category?: string;
  status?: string;
  verification?: string;
  joinedFrom?: string;
  joinedTo?: string;
}
