export type AdminListingCategory = 'HOTEL' | 'TOUR' | 'RESTAURANT' | 'VEHICLE' | 'EXPERIENCE';
export type AdminListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'ARCHIVED' | 'SUSPENDED';

export interface AdminListing {
  id?: number | string | null;
  title?: string | null;
  slug?: string | null;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  images?: Array<{
    id?: number | string;
    imageUrl?: string | null;
    url?: string | null;
    isPrimary?: boolean | null;
    cover?: boolean | null;
  } | null>;
  providerId?: number;
  providerName?: string | null;
  providerBusinessName?: string | null;
  provider?: {
    businessName?: string | null;
    fullName?: string | null;
    name?: string | null;
    verified?: boolean | null;
  } | null;
  providerVerified?: boolean | null;
  category?: AdminListingCategory | string | null;
  status?: AdminListingStatus | string | null;
  city?: string | null;
  country?: string | null;
  location?: string | null;
  basePrice?: number | string | null;
  currency?: string | null;
  priceUnit?: string | null;
  averageRating?: number | string | null;
  rating?: number | string | null;
  reviewCount?: number | string | null;
  totalReviews?: number | string | null;
  bookingCount?: number | string | null;
  totalBookings?: number | string | null;
  viewCount?: number | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastUpdatedAt?: string | null;
  submittedAt?: string | null;
}

export interface AdminListingCategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface AdminListingStatistics {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  draftListings: number;
  suspendedListings: number;
  rejectedListings: number;
  categories: AdminListingCategoryDistribution[];
}

export interface AdminListingPerformancePoint {
  date: string;
  views: number;
  bookings: number;
}

export interface AdminListingPerformance {
  range: string;
  viewSeriesAvailable: boolean;
  bookingSeriesAvailable: boolean;
  totalViews: number;
  totalBookings: number;
  points: AdminListingPerformancePoint[];
}

export interface AdminListingTopProvider {
  providerId: number;
  providerName: string;
  avatarUrl?: string;
  listingCount: number;
  averageRating?: number;
}

export interface AdminListingSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  category?: string;
  status?: string;
  location?: string;
  providerId?: number;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
}
