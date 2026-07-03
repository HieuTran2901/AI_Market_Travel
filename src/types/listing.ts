export type ListingCategory = 'HOTEL' | 'TOUR' | 'RESTAURANT' | 'VEHICLE' | 'EXPERIENCE';

export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'ARCHIVED' | 'SUSPENDED';

export interface ListingImage {
  id: number;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ListingResponse {
  id: number;
  providerId: number;
  providerName: string;
  
  category: ListingCategory;
  title: string;
  slug: string;
  shortDesc?: string;
  description?: string;
  
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  
  coverImageUrl?: string;
  basePrice: number;
  currency: string;
  
  status: ListingStatus;
  rejectionReason?: string;
  
  viewCount: number;
  averageRating?: number;
  reviewCount: number;
  
  createdAt: string;
  updatedAt: string;
  
  images: ListingImage[];
  details?: Record<string, any>; // Flexible payload for category specific details
}

export interface CreateListingRequest {
  category: ListingCategory;
  title: string;
  shortDesc?: string;
  description?: string;
  address: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  basePrice: number;
  currency?: string;
  imageUrls?: string[];
  details?: Record<string, any>;
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {}

export interface ListingSearchRequest {
  keyword?: string;
  category?: ListingCategory;
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  status?: ListingStatus;
  page?: number;
  size?: number;
}
