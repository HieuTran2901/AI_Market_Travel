import api from './api';
import { RecommendationRequest, RecommendationResponse, TripPlanRequest, TripPlanResponse, AssistantRequest, AssistantResponse, TripSaveResponse, SavedTrip } from '../types/ai';

export const aiService = {
  getRecommendations: async (request: RecommendationRequest, signal?: AbortSignal): Promise<RecommendationResponse> => {
    const response = await api.post('/ai/recommendations', request, { signal });
    return response.data.data;
  },

  planTrip: async (request: TripPlanRequest, signal?: AbortSignal): Promise<TripPlanResponse> => {
    const response = await api.post('/ai/trip-plan', request, { signal });
    return response.data.data;
  },

  chatWithAssistant: async (request: AssistantRequest, signal?: AbortSignal): Promise<AssistantResponse> => {
    const response = await api.post('/ai/assistant/chat', request, { signal });
    return response.data.data;
  },

  generateListing: async (request: { prompt: string }, signal?: AbortSignal): Promise<{ rawJson: string }> => {
    const response = await api.post('/ai/provider/generate-listing', request, { signal });
    return response.data.data;
  },

  confirmTripDraft: async (draftId: string): Promise<TripSaveResponse> => {
    const response = await api.post(`/ai/trips/${encodeURIComponent(draftId)}/confirm`);
    return response.data.data;
  },

  getMyTrips: async (): Promise<SavedTrip[]> => {
    const response = await api.get('/trips/my');
    return response.data.data;
  },

  getTrip: async (slug: string): Promise<SavedTrip> => {
    const response = await api.get(`/trips/${encodeURIComponent(slug)}`);
    return response.data.data;
  }
};
