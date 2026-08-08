import {
  AssistantMessage,
  AssistantItineraryCard,
  AssistantListingRecommendation,
  SavedTrip,
  TripPlanResponse
} from '@/types/ai';

export type ChatAttachment = {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  progress: number;
  status: 'local' | 'uploading' | 'uploaded' | 'error';
};

export type TravelChatMessage = AssistantMessage & {
  id: string;
  createdAt: Date;
  attachments?: Pick<ChatAttachment, 'id' | 'previewUrl' | 'uploadedUrl'>[];
  status?: 'sent' | 'error';
  type?: 'TEXT' | 'ITINERARY' | 'RECOMMENDATIONS' | 'CLARIFICATION' | 'ERROR' | 'FLIGHT_RECOMMENDATIONS' | 'FLIGHT_DATE_RECOMMENDATIONS';
  kind?: 'TEXT' | 'ITINERARY' | 'LISTING_RECOMMENDATIONS' | 'ERROR';
  itinerary?: TripPlanResponse;
  itineraryCard?: ChatItinerary;
  recommendations?: AssistantListingRecommendation[];
  savedTrip?: SavedTrip;
  images?: string[];
  extractedContext?: Record<string, unknown>;
  flights?: import('@/types/ai').FlightOfferRecommendation[];
  dateRecommendations?: import('@/types/ai').FlightDealRecommendation[];
  summaryLabels?: import('@/types/ai').FlightSummaryLabel[];
};

export type ChatTransitionState = 'closed' | 'opening' | 'open' | 'closing';
export type RobotMood = 'idle' | 'thinking' | 'success' | 'error';

export type ChatItinerary = {
  destination: string;
  title: string;
  summary: string;
  durationDays: number;
  nights?: number;
  travelers?: number;
  bestTime?: string;
  estimatedBudget?: string;
  budget?: AssistantItineraryCard['budget'];
  coverImage?: string;
  mapImage?: string;
  mapLabel?: string;
  totalEstimatedBudget?: number;
  recommendations?: AssistantListingRecommendation[];
  followUpSuggestions?: string[];
  draftId?: string;
  draftExpiresAt?: string;
  supportsTripSave?: boolean;
  savedTrip?: SavedTrip;
  days: {
    day: number;
    title: string;
    shortTitle?: string;
    description: string;
    morning?: string;
    afternoon?: string;
    evening?: string;
    image?: string;
  }[];
};

export type NormalizedAssistantType = 'TEXT' | 'LISTING_RESULT' | 'RECOMMENDATIONS' | 'ITINERARY' | 'CLARIFICATION' | 'ERROR' | 'FLIGHT_RECOMMENDATIONS' | 'FLIGHT_DATE_RECOMMENDATIONS';

export type ConversationType = 'NORMAL_CHAT' | 'WORKING_MODE';

export type ConversationSession = {
  id: string;
  title: string;
  type: ConversationType;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
};
