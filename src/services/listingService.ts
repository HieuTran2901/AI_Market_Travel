import api from './api';
import { ApiResponse, PageResponse } from '@/types';
import { 
  ListingResponse, 
  ListingExtraService,
  ExtraServiceCategory,
  CreateListingRequest, 
  UpdateListingRequest, 
  ListingSearchRequest,
  ListingStatus 
} from '@/types/listing';

export const listingService = {
  // Public
  searchListings: async (params: ListingSearchRequest) => {
    const response = await api.get<ApiResponse<PageResponse<ListingResponse>>>('/listings', { params });
    return response.data;
  },

  getListingBySlug: async (slug: string) => {
    const response = await api.get<ApiResponse<ListingResponse>>(`/listings/${slug}`);
    return response.data;
  },

  getListingExtras: async (listingId: number, category?: ExtraServiceCategory) => {
    const response = await api.get<ApiResponse<ListingExtraService[]>>(`/listings/${listingId}/extras`, {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  // Provider
  getMyListings: async (params?: { page?: number; size?: number }) => {
    const response = await api.get<ApiResponse<PageResponse<ListingResponse>>>('/listings/my', { params });
    return response.data;
  },

  getMyListingById: async (id: number) => {
    const response = await api.get<ApiResponse<PageResponse<ListingResponse>>>('/listings/my', {
      params: { page: 0, size: 100 }
    });
    const listing = response.data.data.content.find((item) => item.id === id);
    if (!listing) throw new Error('Listing not found in your provider account.');
    return listing;
  },

  createListing: async (data: CreateListingRequest) => {
    const response = await api.post<ApiResponse<ListingResponse>>('/listings', data);
    return response.data;
  },

  updateListing: async (id: number, data: UpdateListingRequest) => {
    const response = await api.put<ApiResponse<ListingResponse>>(`/listings/${id}`, data);
    return response.data;
  },

  changeStatus: async (id: number, status: ListingStatus) => {
    const response = await api.patch<ApiResponse<ListingResponse>>(`/listings/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  deleteListing: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/listings/${id}`);
    return response.data;
  }
};
