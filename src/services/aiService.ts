import api from './api';
import { RecommendationRequest, RecommendationResponse, TripPlanRequest, TripPlanResponse, AssistantRequest, AssistantResponse } from '../types/ai';

export const aiService = {
  getRecommendations: async (request: RecommendationRequest): Promise<RecommendationResponse> => {
    const response = await api.post('/ai/recommendations', request);
    return response.data.data;
  },

  planTrip: async (request: TripPlanRequest): Promise<TripPlanResponse> => {
    const response = await api.post('/ai/trip-plan', request);
    return response.data.data;
  },

  chatWithAssistant: async (request: AssistantRequest): Promise<AssistantResponse> => {
    const response = await api.post('/ai/assistant/chat', request);
    return response.data.data;
  }
};
