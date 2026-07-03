export interface RecommendationRequest {
  destination: string;
  budgetPerPerson?: number;
  startDate?: string;
  endDate?: string;
  groupSize?: number;
  interests?: string[];
  categories?: string[];
  userId?: number;
}

export interface RankedRecommendation {
  rank: number;
  score: number;
  reasoning: string;
  listing: any; // Using any for brevity here, should import Listing type
}

export interface RecommendationResponse {
  recommendations: RankedRecommendation[];
  aiSummary: string;
  destination: string;
  mockedAi: boolean;
}

export interface TripPlanRequest {
  naturalLanguageQuery: string;
  destination: string;
  durationDays?: number;
  totalBudget?: number;
  groupSize?: number;
  startDate?: string;
  focusCategories?: string[];
}

export interface Activity {
  time: string;
  listingId?: number;
  listingName: string;
  type: string;
  description: string;
  estimatedCost?: number;
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  activities: Activity[];
}

export interface TripPlanResponse {
  destination: string;
  durationDays: number;
  itinerary: ItineraryDay[];
  totalEstimatedBudget: number;
  aiSummary: string;
  highlights: string[];
  mockedAi: boolean;
  providerName: string;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequest {
  message: string;
  history: AssistantMessage[];
  contextListingId?: number;
  contextDestination?: string;
}

export interface AssistantResponse {
  reply: string;
  suggestedActions: string[];
  mockedAi: boolean;
}
