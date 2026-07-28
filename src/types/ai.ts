export interface RecommendationRequest {
  destination?: string;
  budgetPerPerson?: number;
  startDate?: string;
  endDate?: string;
  groupSize?: number;
  interests?: string[];
  categories?: string[];
  selectedListingIds?: number[];
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
  destination?: string;
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
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  providerName?: string;
  slug?: string;
  city?: string;
  address?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  summary?: string;
  activityCount?: number;
  estimatedDayCost?: number;
  primaryCategory?: string;
  coverImageUrl?: string;
  highlights?: string[];
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
  marketplaceRecommendations?: any[];
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequest {
  message: string;
  history: AssistantMessage[];
  historyOwnerId?: number | null;
  contextListingId?: number;
  contextDestination?: string;
  extractedContext?: Record<string, unknown>;
}

export interface AssistantListingRecommendation {
  id?: number;
  title?: string;
  name: string;
  category?: string;
  imageUrl?: string;
  location?: string;
  city?: string;
  country?: string;
  priceText?: string;
  price?: number;
  currency?: string;
  priceUnit?: string;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  slug: string;
  ratingText?: string;
  shortDescription?: string;
  providerName?: string;
  tags?: string[];
  matchReason?: string;
  withinBudget?: boolean;
  reasoning?: string;
  rank?: number;
  source?: 'DATABASE';
}

export interface AssistantItineraryDay {
  dayNumber: number;
  title: string;
  shortLabel?: string;
  shortDescription?: string;
  morning?: string;
  afternoon?: string;
  evening?: string;
  highlightImageUrl?: string;
  imageUrl?: string;
  relatedListingIds?: number[];
}

export interface AssistantItineraryCard {
  title: string;
  destination: string;
  durationDays?: number;
  durationNights?: number;
  startDate?: string;
  endDate?: string;
  durationText: string;
  travelerText?: string;
  travelerCount?: number;
  budgetText?: string;
  budget?: {
    requestedTotal?: number;
    estimatedTotal?: number;
    total?: number;
    currency?: string;
    feasible?: boolean;
    withinBudget?: boolean;
    breakdown?: {
      accommodation?: number;
      food?: number;
      transport?: number;
      activities?: number;
      buffer?: number;
    };
  };
  bestTimeText?: string;
  summary: string;
  heroImageUrl?: string;
  mapLabel?: string;
  mapImageUrl?: string;
  listingRecommendations?: AssistantListingRecommendation[];
  recommendedListings?: AssistantListingRecommendation[];
  recommendations?: AssistantListingRecommendation[];
  insufficientMarketplaceData?: boolean;
  missingCategories?: string[];
  groundingMode?: 'DATABASE_ONLY';
  days: AssistantItineraryDay[];
  followUpSuggestions?: string[];
  draftId?: string;
  draftExpiresAt?: string;
  supportsTripSave?: boolean;
}

export interface AssistantTripDraft {
  draftId: string;
  title: string;
  destination: string;
  durationDays?: number;
  durationNights?: number;
  startDate?: string;
  endDate?: string;
  travelerCount?: number;
  budget?: AssistantItineraryCard['budget'];
  summary?: string;
  heroImageUrl?: string;
  days?: AssistantItineraryDay[];
  marketplacePicks?: AssistantListingRecommendation[];
  missingCategories?: string[];
  feasible?: boolean;
  expiresAt?: string;
}

export interface SavedTrip {
  id: number;
  slug: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  durationNights?: number;
  durationText?: string;
  travelerCount?: number;
  budget?: number;
  estimatedCost?: number;
  currency?: string;
  summary?: string;
  heroImageUrl?: string;
  status?: string;
  detailPath?: string;
  days?: Array<{
    dayNumber: number;
    title: string;
    summary?: string;
    imageUrl?: string;
    activities?: Array<{
      timeOfDay: string;
      title: string;
      description?: string;
      listingId?: number;
      listingSlug?: string;
      estimatedCost?: number;
    }>;
  }>;
}

export interface TripSaveResponse {
  success: boolean;
  trip: SavedTrip;
}

export interface AssistantResponse {
  success?: boolean;
  type?:
    | 'TEXT'
    | 'LISTING_RESULT'
    | 'RECOMMENDATIONS'
    | 'ITINERARY'
    | 'CLARIFICATION'
    | 'ERROR'
    | 'FLIGHT_RECOMMENDATIONS'
    | 'FLIGHT_DATE_RECOMMENDATIONS'
    | 'FLIGHT_NO_RESULTS'
    | 'FLIGHT_CLARIFICATION'
    | 'text'
    | 'recommendation'
    | 'recommendations'
    | 'listing_result'
    | 'itinerary'
    | 'clarification'
    | 'error';
  intent?: string;
  purpose?: string;
  confidence?: number;
  contextUsed?: boolean;
  message?: string;
  reply?: string;
  suggestedActions?: string[];
  suggestions?: string[];
  destination?: string;
  heroImageUrl?: string;
  summary?: string;
  recommendations?: AssistantListingRecommendation[];
  flights?: FlightOfferRecommendation[];
  dateRecommendations?: FlightDealRecommendation[];
  summaryLabels?: FlightSummaryLabel[];
  membership?: FlightMembership;
  followUpSuggestions?: string[];
  extractedContext?: Record<string, unknown>;
  itineraryCard?: AssistantItineraryCard;
  itinerary?: AssistantItineraryCard;
  tripDraft?: AssistantTripDraft;
  budgetAdvice?: {
    requestedTotal?: number;
    minimumEstimatedBudget?: number;
    currency?: string;
    alternatives?: string[];
  };
  mockedAi: boolean;
}

export interface FlightDealRecommendation {
  departureDate: string;
  returnDate: string;
  price: number;
  currency: string;
  airlineLogo: string;
  airlineName: string;
  durationText: string;
  routeText: string;
  rankText: string;
  bookingUrl?: string;
}

export interface FlightOfferRecommendation {
  id: string;
  departureTime: string;
  arrivalTime: string;
  airlineLogo: string;
  airlineName: string;
  durationText: string;
  routeText: string;
  stopsText: string;
  price: number;
  currency: string;
  badges: string[];
  bookingUrl: string;
}

export interface FlightMembership {
  tierName: string;
  maxSearchDays: number;
  limitReachedText: string;
}

export interface FlightSummaryLabel {
  title: string;
  value: string;
  type: string;
}
