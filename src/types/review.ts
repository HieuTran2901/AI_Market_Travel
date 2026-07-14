export type ReviewStatus = 'PUBLISHED' | 'PENDING' | 'HIDDEN' | 'REPORTED' | 'DELETED';

export type TripType = 'FAMILY' | 'COUPLE' | 'SOLO' | 'BUSINESS' | 'FRIENDS' | 'OTHER';

export interface ReviewReply {
  id: number;
  reviewId: number;
  userId: number;
  userDisplayName: string;
  replyText: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewImage {
  id?: number;
  imageUrl?: string;
  url?: string;
  altText?: string;
  displayOrder?: number;
}

export interface Review {
  id: number;
  listingId: number;
  userId: number;
  userDisplayName: string;
  userAvatarUrl?: string;
  bookingId?: number;
  rating: number;
  title?: string;
  comment: string;
  tripType?: TripType;
  status: ReviewStatus;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  providerReply?: ReviewReply;
  images?: ReviewImage[];
  media?: ReviewImage[];
  attachments?: ReviewImage[];
  imageUrls?: string[];
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface ReviewSummary {
  listingId: number;
  averageRating?: number;
  reviewCount: number;
  ratingDistribution: RatingDistribution[];
  categoryScores: Record<string, number>;
  latestReviewPreview?: Review;
}

export interface ReviewCreateRequest {
  bookingId: number;
  rating: number;
  title?: string;
  comment: string;
  tripType?: TripType;
  imageUrls?: string[];
}

export interface ReviewUpdateRequest {
  rating?: number;
  title?: string;
  comment?: string;
  tripType?: TripType;
}

export interface ReviewSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  rating?: number;
  tripType?: TripType;
}
