import { AssistantResponse, TripPlanResponse, AssistantItineraryCard, AssistantListingRecommendation, } from '@/types/ai';
import { TravelChatMessage, ChatItinerary, NormalizedAssistantType } from '../types/chat.types';
import { Plane, Hotel, CalendarDays, ShieldCheck } from 'lucide-react';

export const MAX_IMAGES = 4;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const CHAT_STORAGE_KEY = 'travel-ai-concierge-history-v2';

export const getChatStorageKey = (ownerId?: string | number | null) =>
  ownerId ? `${CHAT_STORAGE_KEY}:user:${ownerId}` : `${CHAT_STORAGE_KEY}:guest`;

export const createGreetingMessage = (fallbackName?: string) =>
  createMessage('assistant', `Hi ${fallbackName || 'there'}! I'm your AI travel concierge. How can I help plan your next adventure?`);

export const quickActions = [
  { title: 'Plan a trip', helper: 'Personalized itineraries', icon: Plane, tone: 'from-cyan-400/20 to-blue-500/10 text-cyan-200' },
  { title: 'Find hotels', helper: 'Best stays for you', icon: Hotel, tone: 'from-blue-400/20 to-indigo-500/10 text-blue-200' },
  { title: 'Build itinerary', helper: 'Day-by-day plans', icon: CalendarDays, tone: 'from-violet-400/20 to-purple-500/10 text-violet-200' },
  { title: 'Ask about visa', helper: 'Visa & entry guidance', icon: ShieldCheck, tone: 'from-fuchsia-400/20 to-violet-500/10 text-fuchsia-200' },
];

export const suggestionChips = ['Best beaches in Da Nang', 'Top seafood spots', 'Hoi An day trip'];

export const createMessage = (
  role: 'user' | 'assistant',
  content: string,
  attachments?: TravelChatMessage['attachments'],
  extras?: Partial<TravelChatMessage>
): TravelChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
  createdAt: new Date(),
  attachments,
  status: 'sent',
  type: 'TEXT',
  kind: 'TEXT',
  ...extras,
});

export const normalizePromptText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const isGreetingPrompt = (text: string) => {
  const normalized = normalizePromptText(text);
  return /^(hi|hello|hey|xin chao|chao|chao ban|chao buoi sang|chao buoi toi|alo|ban oi|good morning|good evening)$/.test(normalized);
};

export const isTripPlanningPrompt = (text: string) => {
  const lower = normalizePromptText(text);
  return (
    ['plan a trip', 'itinerary', 'day-by-day', 'day by day', 'travel plan', 'trip to', 'travel to', 'build itinerary', 'getaway', 'vacation', 'holiday', 'lap ke hoach', 'lich trinh', 'du lich', 'chuyen di', 'toi muon di', 'muon di'].some((phrase) =>
      lower.includes(phrase)
    ) || /\b\d+\s*[- ]?(?:day|days|night|nights|ngay|dem)\b/.test(lower)
  );
};

export const isListingRecommendationPrompt = (text: string) => {
  const lower = normalizePromptText(text);
  return ['find hotel', 'find hotels', 'recommend', 'suggest', 'where should i stay', 'under ', 'below ', 'cheap hotel', 'best stay', 'restaurant', 'tour', 'goi y', 'tim', 'khach san', 'nha hang'].some((phrase) =>
    lower.includes(phrase)
  );
};

export const isConversationalPrompt = (text: string) => {
  const lower = normalizePromptText(text);
  return isGreetingPrompt(text)
    || ['ban la ai', 'ban ten gi', 'ban co the lam gi', 'ban lam duoc gi', 'what can you do', 'who are you', 'thank you', 'thanks', 'cam on'].some((phrase) => lower.includes(phrase))
    || ((lower.includes('database') || lower.includes('co so du lieu') || lower.includes('du lieu')) && (lower.includes('ban co the') || lower.includes('can you') || lower.includes('read') || lower.includes('doc')));
};

export const extractDestination = (text: string): string | undefined => {
  const patterns = [
    /\b(?:to|in|for)\s+([A-Z][A-Za-z\s]+?)(?:\s+for|\s+with|\s+in|\s+on|\.|,|$)/,
    /\b([A-Z][A-Za-z\s]+)\s+getaway\b/i,
    /\b(?:ở|tại|đến)\s+([\p{L}\s]+?)(?:\s+dưới|\s+trong|\s+cho|\.|,|$)/iu,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
};

export const extractDuration = (text: string) => {
  const match = normalizePromptText(text).match(/(\d+)\s*(?:day|days|night|nights|ngay|dem)/i);
  return match?.[1] ? Math.max(1, Number(match[1])) : 3;
};

export const getListingImage = (recommendation: any) => {
  const listing = recommendation?.listing;
  return listing?.coverImageUrl || listing?.images?.find((image: any) => image?.isPrimary)?.imageUrl || listing?.images?.[0]?.imageUrl;
};

export const extractBudget = (text: string) => {
  const normalized = text.toLowerCase().replace(/,/g, '').replace(/\./g, '');
  const millionMatch = normalized.match(/(?:under|below|dưới)\s*(\d+(?:\.\d+)?)\s*(?:m|mil|million|triệu)/i);
  if (millionMatch?.[1]) return Number(millionMatch[1]) * 1_000_000;
  const numberMatch = normalized.match(/(?:under|below|dưới)\s*(\d{5,})/i);
  return numberMatch?.[1] ? Number(numberMatch[1]) : undefined;
};

export const inferCategories = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('hotel') || lower.includes('khách sạn') || lower.includes('stay')) return ['HOTEL'];
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('seafood')) return ['RESTAURANT'];
  if (lower.includes('tour')) return ['TOUR'];
  if (lower.includes('car') || lower.includes('vehicle')) return ['VEHICLE'];
  if (lower.includes('experience') || lower.includes('workshop')) return ['EXPERIENCE'];
  return undefined;
};

export const formatBudget = (value?: number) => {
  if (!value) return undefined;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatMoney = (value?: number, currency = 'VND') => {
  if (value === undefined || value === null) return undefined;
  try {
    return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
};

export const safeAmount = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);

export const breakdownFallbackTotal = (budget?: ChatItinerary['budget']) => {
  const breakdown = budget?.breakdown;
  if (!breakdown) return 0;
  return safeAmount(breakdown.accommodation)
    + safeAmount(breakdown.food)
    + safeAmount(breakdown.transport)
    + safeAmount(breakdown.activities)
    + safeAmount(breakdown.buffer);
};

export const resolvedBudgetTotal = (budget?: ChatItinerary['budget'], warn = false) => {
  const explicit = safeAmount(budget?.total) || safeAmount(budget?.estimatedTotal);
  if (explicit > 0) return explicit;
  const fallback = breakdownFallbackTotal(budget);
  if (fallback > 0 && warn && import.meta.env.DEV) {
    console.warn('Trip cost total missing; used breakdown fallback');
  }
  return fallback > 0 ? fallback : undefined;
};

export const bucketActivityByTime = (time = ''): 'morning' | 'afternoon' | 'evening' => {
  const lower = time.toLowerCase();
  if (lower.includes('evening') || lower.includes('night') || lower.includes('dinner') || /^1[7-9]|^2[0-3]/.test(lower)) return 'evening';
  if (lower.includes('afternoon') || lower.includes('lunch') || /^1[2-6]/.test(lower)) return 'afternoon';
  return 'morning';
};

export const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

export const normalizeTripPlanForChat = (tripPlan: TripPlanResponse, images: string[] = [], travelers?: number): ChatItinerary => {
  const durationDays = tripPlan.durationDays || tripPlan.itinerary?.length || 3;
  const days =
    tripPlan.itinerary?.map((day, index) => {
      const activityByPeriod: Partial<Record<'morning' | 'afternoon' | 'evening', string>> = {};
      day.activities?.forEach((activity) => {
        const bucket = bucketActivityByTime(activity.time);
        if (!activityByPeriod[bucket]) {
          activityByPeriod[bucket] = activity.listingName || activity.description;
        }
      });
      const activityDescriptions = day.activities
        ?.map((activity) => activity.listingName || activity.description)
        .filter(Boolean)
        .slice(0, 3);

      return {
        day: day.dayNumber || index + 1,
        title: day.theme || `Day ${index + 1}`,
        shortTitle: (day.theme || `Day ${index + 1}`).replace(/&/g, 'and').split(/\s+/).slice(0, 3).join(' '),
        description: activityDescriptions?.length ? activityDescriptions.join(', ') : 'Curated places, timing, and local travel ideas.',
        morning: activityByPeriod.morning,
        afternoon: activityByPeriod.afternoon,
        evening: activityByPeriod.evening,
        image: images[index + 1] || images[index] || undefined,
      };
    }) || [];

  return {
    destination: tripPlan.destination || 'Your trip',
    title: `${tripPlan.destination || 'Your trip'} Getaway`,
    summary: tripPlan.aiSummary || 'A personalized day-by-day travel plan based on your destination, preferences, and marketplace options.',
    durationDays,
    nights: Math.max(durationDays - 1, 0),
    travelers,
    coverImage: images[0],
    estimatedBudget: formatBudget(tripPlan.totalEstimatedBudget),
    totalEstimatedBudget: tripPlan.totalEstimatedBudget,
    days,
  };
};

export const looksLikeRawItineraryMarkdown = (text?: string) => {
  const value = text || '';
  return /(^|\n)\s*#{1,3}\s*(day|ngay|ngày)\s*\d+/i.test(value)
    || /(^|\n)\s*(\*\*)?(sang|sáng|morning|afternoon|evening|toi|tối)(\*\*)?\s*[:|-]/i.test(value)
    || /\|[^|\n]+\|[^|\n]+\|/.test(value)
    || /(^|\n)\s*---+\s*(\n|$)/.test(value);
};

export const parseDurationText = (durationText?: string) => {
  if (!durationText) return { days: 3, nights: 2 };
  const dayMatch = durationText.match(/(\d+)\s*d/i) || durationText.match(/(\d+)\s*day/i);
  const nightMatch = durationText.match(/(\d+)\s*n/i) || durationText.match(/(\d+)\s*night/i);
  const days = dayMatch?.[1] ? Number(dayMatch[1]) : 3;
  return {
    days: Number.isFinite(days) ? days : 3,
    nights: nightMatch?.[1] ? Number(nightMatch[1]) : Math.max((Number.isFinite(days) ? days : 3) - 1, 0),
  };
};

export const normalizeAssistantItineraryForChat = (card: AssistantItineraryCard): ChatItinerary => {
  const duration = parseDurationText(card.durationText);
  const travelerMatch = card.travelerText?.match(/\d+/);
  const listingRecommendations = (card.listingRecommendations || card.recommendedListings || card.recommendations || []).filter(isDatabaseListing);
  return {
    destination: card.destination || 'Your trip',
    title: card.title || `${card.destination || 'Your trip'} Getaway`,
    summary: card.summary || 'A personalized day-by-day travel plan based on current marketplace options.',
    durationDays: card.durationDays || duration.days,
    nights: card.durationNights ?? duration.nights,
    travelers: travelerMatch?.[0] ? Number(travelerMatch[0]) : undefined,
    bestTime: card.bestTimeText,
    estimatedBudget: card.budgetText,
    budget: card.budget,
    coverImage: card.heroImageUrl || listingRecommendations?.find((item) => item.imageUrl)?.imageUrl,
    mapImage: card.mapImageUrl,
    mapLabel: card.mapLabel,
    recommendations: listingRecommendations,
    followUpSuggestions: card.followUpSuggestions,
    draftId: card.draftId,
    draftExpiresAt: card.draftExpiresAt,
    supportsTripSave: card.supportsTripSave,
    days: (card.days?.length ? card.days : [{ dayNumber: 1, title: 'Arrival and orientation' }]).map((day, index) => ({
      day: day.dayNumber || index + 1,
      title: day.title || `Day ${index + 1}`,
      shortTitle: day.shortLabel || (day.title || `Day ${index + 1}`).split(/\s+/).slice(0, 3).join(' '),
      description: [day.morning, day.afternoon, day.evening].filter(Boolean).join(' • ') || 'Curated timing and local travel ideas.',
      morning: day.morning,
      afternoon: day.afternoon,
      evening: day.evening,
      image: day.imageUrl || day.highlightImageUrl || listingRecommendations?.[index]?.imageUrl,
    })),
  };
};

export const isDatabaseListing = (listing: Partial<AssistantListingRecommendation> | undefined | null): listing is AssistantListingRecommendation => (
  Boolean(listing?.source === 'DATABASE' && listing.slug && (listing.title || listing.name))
);

export const isTripSaveConfirmation = (text: string) => {
  const normalized = normalizePromptText(text);
  return /save this trip|add to my trips|add this trip|save trip|luu lai|luu chuyen|them chuyen|dong y.*chuyen|them vao danh sach/.test(normalized);
};

export const normalizeAssistantType = (value?: string): NormalizedAssistantType => {
  const normalized = value?.trim().toUpperCase();
  if (normalized === 'TEXT') return 'TEXT';
  if (normalized === 'ITINERARY') return 'ITINERARY';
  if (normalized === 'RECOMMENDATION' || normalized === 'RECOMMENDATIONS') return 'RECOMMENDATIONS';
  if (normalized === 'LISTING_RESULT') return 'LISTING_RESULT';
  if (normalized === 'CLARIFICATION') return 'CLARIFICATION';
  if (normalized === 'FLIGHT_RECOMMENDATIONS') return 'FLIGHT_RECOMMENDATIONS';
  if (normalized === 'FLIGHT_DATE_RECOMMENDATIONS') return 'FLIGHT_DATE_RECOMMENDATIONS';
  if (normalized === 'ERROR') return 'ERROR';
  return 'ERROR';
};

export const normalizeAssistantResponse = (response: AssistantResponse): TravelChatMessage => {
  const type = normalizeAssistantType(response.type);
  const text = response.message || response.reply || 'The AI concierge did not return a response.';
  const planningIntent = /TRIP|ITINERARY|RECOMMENDATION|MARKETPLACE|DESTINATION/i.test(response.intent || '');

  const itineraryPayload = response.itineraryCard || response.itinerary;

  if (response.success === false || type === 'ERROR') {
    return createMessage('assistant', text || 'The AI concierge could not complete that request. Please try again.', undefined, {
      type: 'ERROR',
      kind: 'ERROR',
      extractedContext: response.extractedContext,
    });
  }

  if (type === 'ITINERARY') {
    if (!itineraryPayload?.days?.length) {
      return createMessage('assistant', 'I prepared a travel plan, but could not render the itinerary card. Please try again.', undefined, {
        type: 'ERROR',
        kind: 'ERROR',
        extractedContext: response.extractedContext,
      });
    }
    return createMessage('assistant', text, undefined, {
      type: 'ITINERARY',
      kind: 'ITINERARY',
      itineraryCard: normalizeAssistantItineraryForChat({
        ...itineraryPayload,
        listingRecommendations: itineraryPayload.listingRecommendations || itineraryPayload.recommendedListings || itineraryPayload.recommendations,
      }),
      extractedContext: response.extractedContext,
    });
  }

  const databaseRecommendations = (response.recommendations || []).filter(isDatabaseListing);

  if ((type === 'RECOMMENDATIONS' || type === 'LISTING_RESULT') && databaseRecommendations.length) {
    return createMessage('assistant', response.summary || text, undefined, {
      type: 'RECOMMENDATIONS',
      kind: 'LISTING_RECOMMENDATIONS',
      recommendations: databaseRecommendations,
      images: response.heroImageUrl ? [response.heroImageUrl] : undefined,
      extractedContext: response.extractedContext,
    });
  }

  if (type === 'FLIGHT_RECOMMENDATIONS' || type === 'FLIGHT_DATE_RECOMMENDATIONS') {
    return createMessage('assistant', text, undefined, {
      type,
      kind: 'TEXT',
      flights: response.flights,
      dateRecommendations: response.dateRecommendations,
      summaryLabels: response.summaryLabels,
      extractedContext: response.extractedContext,
    });
  }

  if (type === 'RECOMMENDATIONS' || type === 'LISTING_RESULT') {
    return createMessage('assistant', text, undefined, {
      type: 'CLARIFICATION',
      extractedContext: response.extractedContext,
    });
  }

  if (planningIntent && looksLikeRawItineraryMarkdown(text)) {
    return createMessage('assistant', 'I prepared travel content, but could not render it as a card. Please try again and I’ll rebuild it visually.', undefined, {
      type: 'ERROR',
      kind: 'ERROR',
      extractedContext: response.extractedContext,
    });
  }

  return createMessage('assistant', text, undefined, {
    type: type === 'CLARIFICATION' ? 'CLARIFICATION' : 'TEXT',
    extractedContext: response.extractedContext,
  });
};

export const hydrateMessages = (storageKey: string, fallbackName?: string): TravelChatMessage[] => {
  if (typeof window === 'undefined') {
    return [createGreetingMessage(fallbackName)];
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) throw new Error('No stored chat history');
    const storedValue = JSON.parse(stored) as TravelChatMessage[] | { messages?: TravelChatMessage[] };
    const parsed = Array.isArray(storedValue) ? storedValue : storedValue.messages;
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid chat history');
    return parsed.map((message) => {
      if (message.role === 'assistant' && !message.itineraryCard && !message.itinerary && looksLikeRawItineraryMarkdown(message.content)) {
        return {
          ...message,
          type: 'ERROR' as const,
          kind: 'ERROR' as const,
          content: 'This older itinerary response could not be rendered as a card. Send the request again and I’ll rebuild it visually.',
          createdAt: new Date(message.createdAt),
        };
      }
      return {
        ...message,
        itineraryCard: message.itineraryCard || (message.itinerary ? normalizeTripPlanForChat(message.itinerary, message.images) : undefined),
        createdAt: new Date(message.createdAt),
        attachments: message.attachments?.map((attachment) => ({
          ...attachment,
          previewUrl: attachment.uploadedUrl || attachment.previewUrl,
        })),
      };
    });
  } catch {
    return [createGreetingMessage(fallbackName)];
  }
};

export const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return undefined;
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  try {
    if (startDate && endDate) return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
    return formatter.format(new Date(startDate || endDate || ''));
  } catch {
    return startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate;
  }
};

export const budgetStatusText = (budget?: ChatItinerary['budget']) => {
  if (!budget) return 'Estimate unavailable';
  const total = resolvedBudgetTotal(budget);
  if (!total) return 'Estimate unavailable';
  const withinBudget = budget.withinBudget ?? budget.feasible ?? (budget.requestedTotal ? total <= budget.requestedTotal : true);
  return withinBudget ? 'Within budget' : 'Adjustment needed';
};

export const budgetStatusClass = (budget?: ChatItinerary['budget']) => {
  const total = resolvedBudgetTotal(budget);
  if (!budget || !total) return 'text-blue-100';
  const withinBudget = budget.withinBudget ?? budget.feasible ?? (budget.requestedTotal ? total <= budget.requestedTotal : true);
  return withinBudget ? 'text-emerald-200' : 'text-amber-200';
};

export const formatListingPrice = (listing: any) => {
  const amount = Number(listing?.basePrice);
  if (!Number.isFinite(amount)) return 'Price unavailable';
  const currency = listing?.currency || 'VND';
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('vi-VN')} ${currency}`;
  }
};

export const hydrateTravelContext = (messages: TravelChatMessage[]): Record<string, unknown> => {
  return (
    [...messages]
      .reverse()
      .find((message) => message.extractedContext && Object.keys(message.extractedContext).length > 0)
      ?.extractedContext || {}
  );
};

