import api from './api';
import { ApiResponse, PageResponse } from '@/types';
import {
  Review,
  ReviewCreateRequest,
  ReviewSearchParams,
  ReviewSummary,
  ReviewUpdateRequest,
} from '@/types/review';

export const reviewService = {
  getListingReviews: async (listingId: number, params?: ReviewSearchParams) => {
    const response = await api.get<ApiResponse<PageResponse<Review>>>(`/listings/${listingId}/reviews`, { params });
    return response.data;
  },

  getListingReviewSummary: async (listingId: number) => {
    const response = await api.get<ApiResponse<ReviewSummary>>(`/listings/${listingId}/reviews/summary`);
    return response.data;
  },

  createReview: async (listingId: number, data: ReviewCreateRequest) => {
    const response = await api.post<ApiResponse<Review>>(`/listings/${listingId}/reviews`, data);
    return response.data;
  },

  updateReview: async (reviewId: number, data: ReviewUpdateRequest) => {
    const response = await api.put<ApiResponse<Review>>(`/reviews/${reviewId}`, data);
    return response.data;
  },

  deleteReview: async (reviewId: number) => {
    const response = await api.delete<ApiResponse<void>>(`/reviews/${reviewId}`);
    return response.data;
  },
};
