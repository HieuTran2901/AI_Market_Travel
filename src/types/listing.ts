export type ListingCategory = 'HOTEL' | 'TOUR' | 'RESTAURANT' | 'VEHICLE' | 'EXPERIENCE';

export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'ARCHIVED' | 'SUSPENDED';

export type ExtraServiceCategory = 'FOOD_DRINK' | 'COMFORT' | 'TRANSPORT' | 'EXPERIENCE' | 'OTHER';

export type ExtraServicePricingUnit =
  | 'STAY'
  | 'GUEST'
  | 'BOTTLE'
  | 'RIDE'
  | 'ROOM'
  | 'NIGHT'
  | 'ITEM'
  | 'BOOKING';

export interface ListingExtraService {
  id: number;
  listingId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category: ExtraServiceCategory;
  price: number;
  currency: string;
  pricingUnit: ExtraServicePricingUnit;
  maxQuantity?: number;
  available: boolean;
}

export interface ListingImage {
  id: number;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export type ListingImageCategory = 'Exterior' | 'Room' | 'Bathroom' | 'Pool' | 'Dining' | 'View' | 'Amenity' | 'Other';

export interface ListingImageDraft {
  url: string;
  caption?: string;
  category?: ListingImageCategory;
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
  coinPrice?: number;
  aiCoinPrice?: number;
  coinFare?: number;
  
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
