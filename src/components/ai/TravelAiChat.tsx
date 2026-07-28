import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Check,
  Clock3,
  History,
  Hotel,
  Image,
  Loader2,
  Map,
  Paperclip,
  Pin,
  Plane,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { aiService } from '@/services/aiService';
import { storageService } from '@/services/storageService';
import { FlightOfferCard } from './flights/FlightOfferCard';
import { FlightDealCard } from './flights/FlightDealCard';
import { FlightSummaryLabels } from './flights/FlightSummaryLabels';
import { AssistantItineraryCard, AssistantListingRecommendation, AssistantMessage, AssistantResponse, SavedTrip, TripPlanResponse } from '@/types/ai';
import { useAuth } from '@/context/AuthContext';
import { getListingDetailPath } from '@/utils/listingRoutes';

type ChatAttachment = {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  progress: number;
  status: 'local' | 'uploading' | 'uploaded' | 'error';
};

type TravelChatMessage = AssistantMessage & {
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

type ChatTransitionState = 'closed' | 'opening' | 'open' | 'closing';
type RobotMood = 'idle' | 'thinking' | 'success' | 'error';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CHAT_STORAGE_KEY = 'travel-ai-concierge-history-v2';

const getChatStorageKey = (ownerId?: string | number | null) =>
  ownerId ? `${CHAT_STORAGE_KEY}:user:${ownerId}` : `${CHAT_STORAGE_KEY}:guest`;

const createGreetingMessage = (fallbackName?: string) =>
  createMessage('assistant', `Hi ${fallbackName || 'there'}! I'm your AI travel concierge. How can I help plan your next adventure?`);

type ChatItinerary = {
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

const quickActions = [
  { title: 'Plan a trip', helper: 'Personalized itineraries', icon: Plane, tone: 'from-cyan-400/20 to-blue-500/10 text-cyan-200' },
  { title: 'Find hotels', helper: 'Best stays for you', icon: Hotel, tone: 'from-blue-400/20 to-indigo-500/10 text-blue-200' },
  { title: 'Build itinerary', helper: 'Day-by-day plans', icon: CalendarDays, tone: 'from-violet-400/20 to-purple-500/10 text-violet-200' },
  { title: 'Ask about visa', helper: 'Visa & entry guidance', icon: ShieldCheck, tone: 'from-fuchsia-400/20 to-violet-500/10 text-fuchsia-200' },
];

const suggestionChips = ['Best beaches in Da Nang', 'Top seafood spots', 'Hoi An day trip'];

const createMessage = (
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

const normalizePromptText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isGreetingPrompt = (text: string) => {
  const normalized = normalizePromptText(text);
  return /^(hi|hello|hey|xin chao|chao|chao ban|chao buoi sang|chao buoi toi|alo|ban oi|good morning|good evening)$/.test(normalized);
};

const isTripPlanningPrompt = (text: string) => {
  const lower = normalizePromptText(text);
  return (
    ['plan a trip', 'itinerary', 'day-by-day', 'day by day', 'travel plan', 'trip to', 'travel to', 'build itinerary', 'getaway', 'vacation', 'holiday', 'lap ke hoach', 'lich trinh', 'du lich', 'chuyen di', 'toi muon di', 'muon di'].some((phrase) =>
      lower.includes(phrase)
    ) || /\b\d+\s*[- ]?(?:day|days|night|nights|ngay|dem)\b/.test(lower)
  );
};

const isListingRecommendationPrompt = (text: string) => {
  const lower = normalizePromptText(text);
  return ['find hotel', 'find hotels', 'recommend', 'suggest', 'where should i stay', 'under ', 'below ', 'cheap hotel', 'best stay', 'restaurant', 'tour', 'goi y', 'tim', 'khach san', 'nha hang'].some((phrase) =>
    lower.includes(phrase)
  );
};

const isConversationalPrompt = (text: string) => {
  const lower = normalizePromptText(text);
  return isGreetingPrompt(text)
    || ['ban la ai', 'ban ten gi', 'ban co the lam gi', 'ban lam duoc gi', 'what can you do', 'who are you', 'thank you', 'thanks', 'cam on'].some((phrase) => lower.includes(phrase))
    || ((lower.includes('database') || lower.includes('co so du lieu') || lower.includes('du lieu')) && (lower.includes('ban co the') || lower.includes('can you') || lower.includes('read') || lower.includes('doc')));
};

const extractDestination = (text: string): string | undefined => {
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

const extractDuration = (text: string) => {
  const match = normalizePromptText(text).match(/(\d+)\s*(?:day|days|night|nights|ngay|dem)/i);
  return match?.[1] ? Math.max(1, Number(match[1])) : 3;
};

const getListingImage = (recommendation: any) => {
  const listing = recommendation?.listing;
  return listing?.coverImageUrl || listing?.images?.find((image: any) => image?.isPrimary)?.imageUrl || listing?.images?.[0]?.imageUrl;
};

const extractBudget = (text: string) => {
  const normalized = text.toLowerCase().replace(/,/g, '').replace(/\./g, '');
  const millionMatch = normalized.match(/(?:under|below|dưới)\s*(\d+(?:\.\d+)?)\s*(?:m|mil|million|triệu)/i);
  if (millionMatch?.[1]) return Number(millionMatch[1]) * 1_000_000;
  const numberMatch = normalized.match(/(?:under|below|dưới)\s*(\d{5,})/i);
  return numberMatch?.[1] ? Number(numberMatch[1]) : undefined;
};

const inferCategories = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('hotel') || lower.includes('khách sạn') || lower.includes('stay')) return ['HOTEL'];
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('seafood')) return ['RESTAURANT'];
  if (lower.includes('tour')) return ['TOUR'];
  if (lower.includes('car') || lower.includes('vehicle')) return ['VEHICLE'];
  if (lower.includes('experience') || lower.includes('workshop')) return ['EXPERIENCE'];
  return undefined;
};

const formatBudget = (value?: number) => {
  if (!value) return undefined;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatMoney = (value?: number, currency = 'VND') => {
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

const safeAmount = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);

const breakdownFallbackTotal = (budget?: ChatItinerary['budget']) => {
  const breakdown = budget?.breakdown;
  if (!breakdown) return 0;
  return safeAmount(breakdown.accommodation)
    + safeAmount(breakdown.food)
    + safeAmount(breakdown.transport)
    + safeAmount(breakdown.activities)
    + safeAmount(breakdown.buffer);
};

const resolvedBudgetTotal = (budget?: ChatItinerary['budget'], warn = false) => {
  const explicit = safeAmount(budget?.total) || safeAmount(budget?.estimatedTotal);
  if (explicit > 0) return explicit;
  const fallback = breakdownFallbackTotal(budget);
  if (fallback > 0 && warn && import.meta.env.DEV) {
    console.warn('Trip cost total missing; used breakdown fallback');
  }
  return fallback > 0 ? fallback : undefined;
};

const bucketActivityByTime = (time = ''): 'morning' | 'afternoon' | 'evening' => {
  const lower = time.toLowerCase();
  if (lower.includes('evening') || lower.includes('night') || lower.includes('dinner') || /^1[7-9]|^2[0-3]/.test(lower)) return 'evening';
  if (lower.includes('afternoon') || lower.includes('lunch') || /^1[2-6]/.test(lower)) return 'afternoon';
  return 'morning';
};


const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

const normalizeTripPlanForChat = (tripPlan: TripPlanResponse, images: string[] = [], travelers?: number): ChatItinerary => {
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

const looksLikeRawItineraryMarkdown = (text?: string) => {
  const value = text || '';
  return /(^|\n)\s*#{1,3}\s*(day|ngay|ngày)\s*\d+/i.test(value)
    || /(^|\n)\s*(\*\*)?(sang|sáng|morning|afternoon|evening|toi|tối)(\*\*)?\s*[:|-]/i.test(value)
    || /\|[^|\n]+\|[^|\n]+\|/.test(value)
    || /(^|\n)\s*---+\s*(\n|$)/.test(value);
};

const parseDurationText = (durationText?: string) => {
  if (!durationText) return { days: 3, nights: 2 };
  const dayMatch = durationText.match(/(\d+)\s*d/i) || durationText.match(/(\d+)\s*day/i);
  const nightMatch = durationText.match(/(\d+)\s*n/i) || durationText.match(/(\d+)\s*night/i);
  const days = dayMatch?.[1] ? Number(dayMatch[1]) : 3;
  return {
    days: Number.isFinite(days) ? days : 3,
    nights: nightMatch?.[1] ? Number(nightMatch[1]) : Math.max((Number.isFinite(days) ? days : 3) - 1, 0),
  };
};

const normalizeAssistantItineraryForChat = (card: AssistantItineraryCard): ChatItinerary => {
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

const isDatabaseListing = (listing: Partial<AssistantListingRecommendation> | undefined | null): listing is AssistantListingRecommendation => (
  Boolean(listing?.source === 'DATABASE' && listing.slug && (listing.title || listing.name))
);

type NormalizedAssistantType = 'TEXT' | 'LISTING_RESULT' | 'RECOMMENDATIONS' | 'ITINERARY' | 'CLARIFICATION' | 'ERROR' | 'FLIGHT_RECOMMENDATIONS' | 'FLIGHT_DATE_RECOMMENDATIONS';

const isTripSaveConfirmation = (text: string) => {
  const normalized = normalizePromptText(text);
  return /save this trip|add to my trips|add this trip|save trip|luu lai|luu chuyen|them chuyen|dong y.*chuyen|them vao danh sach/.test(normalized);
};

const normalizeAssistantType = (value?: string): NormalizedAssistantType => {
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

const normalizeAssistantResponse = (response: AssistantResponse): TravelChatMessage => {
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

const hydrateMessages = (storageKey: string, fallbackName?: string): TravelChatMessage[] => {
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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const useRobotMood = ({
  isSending,
  error,
  lastCompletedMessageId,
}: {
  isSending: boolean;
  error: boolean;
  lastCompletedMessageId?: string;
}) => {
  const [mood, setMood] = useState<RobotMood>('idle');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousCompletedRef = useRef<string | undefined>(lastCompletedMessageId);

  useEffect(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }

    if (error) {
      setMood('error');
      errorTimerRef.current = setTimeout(() => {
        setMood('idle');
        errorTimerRef.current = null;
      }, 2800);
      return;
    }

    if (isSending) {
      setMood('thinking');
      return;
    }

    if (lastCompletedMessageId && previousCompletedRef.current !== lastCompletedMessageId) {
      previousCompletedRef.current = lastCompletedMessageId;
      setMood('success');
      successTimerRef.current = setTimeout(() => {
        setMood('idle');
        successTimerRef.current = null;
      }, 1500);
      return;
    }

    setMood('idle');
  }, [error, isSending, lastCompletedMessageId]);

  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    },
    []
  );

  return mood;
};

const TravelLauncherRobot = ({
  mood,
  hasUnread,
  pressed,
  portalActive = false,
}: {
  mood: RobotMood;
  hasUnread: boolean;
  pressed: boolean;
  portalActive?: boolean;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0, tilt: 0 });
  const currentRef = useRef({ x: 0, y: 0, tilt: 0 });
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);

  const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const supportsTracking = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !reducedMotion();

  const writeRobotVars = (x: number, y: number, tilt: number) => {
    const node = rootRef.current;
    if (!node) return;
    node.style.setProperty('--eye-x', `${x.toFixed(2)}px`);
    node.style.setProperty('--eye-y', `${y.toFixed(2)}px`);
    node.style.setProperty('--robot-tilt', `${tilt.toFixed(2)}deg`);
  };

  const stopTracking = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const animateTracking = () => {
    const current = currentRef.current;
    const target = targetRef.current;
    current.x += (target.x - current.x) * 0.22;
    current.y += (target.y - current.y) * 0.22;
    current.tilt += (target.tilt - current.tilt) * 0.2;
    writeRobotVars(current.x, current.y, current.tilt);

    if (Math.abs(current.x - target.x) > 0.05 || Math.abs(current.y - target.y) > 0.05 || Math.abs(current.tilt - target.tilt) > 0.05) {
      frameRef.current = requestAnimationFrame(animateTracking);
    } else {
      frameRef.current = null;
    }
  };

  const startTracking = () => {
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(animateTracking);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!supportsTracking()) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clamp((event.clientX - centerX) / 12, -4, 4);
    const y = clamp((event.clientY - centerY) / 12, -3, 3);
    targetRef.current = { x, y, tilt: clamp((event.clientX - centerX) / 18, -4, 4) };
    startTracking();
  };

  const resetTracking = () => {
    targetRef.current = { x: 0, y: 0, tilt: 0 };
    startTracking();
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof document === 'undefined') return;

    let isVisibleInViewport = true;
    const updatePaused = () => setIsAnimationPaused(document.hidden || !isVisibleInViewport);
    const handleVisibility = () => updatePaused();

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            isVisibleInViewport = entry?.isIntersecting ?? true;
            updatePaused();
          })
        : null;

    observer?.observe(node);
    document.addEventListener('visibilitychange', handleVisibility);
    updatePaused();

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const stateClass = `travel-ai-launcher-robot--${mood} ${hasUnread ? 'travel-ai-launcher-robot--unread' : ''} ${isAnimationPaused ? 'travel-ai-launcher-robot--paused' : ''}`;

  return (
    <div
      ref={rootRef}
      className={`travel-ai-launcher-robot ${stateClass} ${pressed ? 'travel-ai-launcher-robot--pressed' : ''} ${portalActive ? 'travel-ai-launcher-robot--portal' : ''} relative h-12 w-12 shrink-0`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTracking}
      aria-hidden="true"
    >
      <svg className="h-full w-full overflow-visible" viewBox="0 0 64 64" role="img" aria-label="Travel AI robot">
        <defs>
          <linearGradient id="travelRobotShell" x1="9" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="0.52" stopColor="#6366F1" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <radialGradient id="travelRobotFace" cx="50%" cy="42%" r="68%">
            <stop stopColor="#F8FAFC" />
            <stop offset="1" stopColor="#C7D2FE" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="url(#travelRobotShell)" />
        <circle cx="32" cy="32" r="24" fill="rgba(255,255,255,0.22)" />
        <path d="M22 28C22 20.8 26.8 16 32 16C37.2 16 42 20.8 42 28V29H22V28Z" fill="url(#travelRobotFace)" />
        <rect x="18" y="27" width="28" height="21" rx="10" fill="#061A3B" />
        <path d="M27 13L32 8L37 13" fill="none" stroke="#DBEAFE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="7.5" r="2.4" fill="#67E8F9" />
        <g className="travel-ai-launcher-eye-group robot-eyes">
          <ellipse className="travel-ai-launcher-eye travel-ai-launcher-eye-left" cx="27" cy="36" rx="3.8" ry="2.6" fill="#67E8F9" />
          <ellipse className="travel-ai-launcher-eye travel-ai-launcher-eye-right" cx="37" cy="36" rx="3.8" ry="2.6" fill="#67E8F9" />
        </g>
        <path className="travel-ai-robot-mouth travel-ai-robot-mouth--idle" d="M27 43C29.8 45.2 34.4 45.2 37 43" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
        <path className="travel-ai-robot-mouth travel-ai-robot-mouth--success" d="M25.5 42C28.8 46 35.4 46 38.5 42" fill="none" stroke="#BAE6FD" strokeWidth="2.2" strokeLinecap="round" />
        <path className="travel-ai-robot-mouth travel-ai-robot-mouth--error" d="M28 45C30.5 42.8 34.2 42.8 36.5 45" fill="none" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" />
        <g className="travel-ai-robot-keyboard robot-keyboard">
          <rect x="23" y="49" width="18" height="5.5" rx="2" fill="#0EA5E9" opacity="0.9" />
          <path d="M26 51.2H38" stroke="#DBEAFE" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        </g>
        <g className="travel-ai-robot-hand travel-ai-robot-left-hand robot-left-hand">
          <path d="M19 48C22 48.2 24 49.1 26 51" fill="none" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="travel-ai-robot-hand travel-ai-robot-right-hand robot-right-hand">
          <path d="M45 48C42 48.2 40 49.1 38 51" fill="none" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="travel-ai-robot-status-effects robot-status-effects">
          <circle className="travel-ai-robot-success-dot" cx="45" cy="20" r="1.8" fill="#A7F3D0" />
          <path className="travel-ai-robot-error-mark" d="M46 18V23M46 27H46.1" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" />
          <path className="travel-ai-robot-thinking-dot travel-ai-robot-thinking-dot-1" d="M20 20H20.1" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
          <path className="travel-ai-robot-thinking-dot travel-ai-robot-thinking-dot-2" d="M25 18H25.1" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
          <path className="travel-ai-robot-thinking-dot travel-ai-robot-thinking-dot-3" d="M30 20H30.1" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
        </g>
        <path d="M12 31H8.5C7.1 31 6 32.1 6 33.5V38" fill="none" stroke="#BAE6FD" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M52 31H55.5C56.9 31 58 32.1 58 33.5V38" fill="none" stroke="#BAE6FD" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <Sparkles className="travel-ai-launcher-sparkle travel-ai-launcher-sparkle-one absolute -right-1 top-1 h-3.5 w-3.5 text-cyan-100" />
      <Sparkles className="travel-ai-launcher-sparkle travel-ai-launcher-sparkle-two absolute -left-1 bottom-1 h-3 w-3 text-violet-100" />
    </div>
  );
};

const ChatItineraryCard = ({ itinerary, images = [] }: { itinerary: TripPlanResponse; images?: string[] }) => {
  const coverImage = images[0];
  return (
    <div className="mt-2 w-full overflow-hidden rounded-2xl border border-white/12 bg-white/10 shadow-xl shadow-blue-950/20 backdrop-blur">
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-black text-white">{itinerary.destination} Getaway</h4>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-blue-100">{itinerary.aiSummary || 'A personalized day-by-day travel plan.'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold text-blue-100">
          {itinerary.durationDays || itinerary.itinerary?.length || 3} days
        </span>
      </div>
      <div className="mx-3 h-36 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-300/70 to-blue-700/80">
        {coverImage ? (
          <img src={coverImage} alt={`${itinerary.destination} itinerary cover`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 420 170" fill="none">
            <path d="M0 94C68 48 132 51 200 88C269 126 333 99 420 52V170H0V94Z" fill="#BAE6FD" />
            <path d="M35 126C108 90 182 89 263 125" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" opacity="0.65" />
            <circle cx="316" cy="50" r="25" fill="#FBBF24" />
            <path d="M48 91L132 24L210 91H48Z" fill="#0F766E" opacity="0.75" />
            <path d="M177 98L265 29L352 98H177Z" fill="#0284C7" opacity="0.55" />
          </svg>
        )}
      </div>
      <div className="space-y-2 p-3">
        {itinerary.itinerary?.slice(0, 4).map((day, index) => (
          <div key={day.dayNumber} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl bg-slate-950/20 p-2">
            <div className="h-16 overflow-hidden rounded-lg bg-white/10">
              {images[index + 1] ? (
                <img src={images[index + 1]} alt={day.theme} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-blue-100">
                  <Map className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-100">Day {day.dayNumber} — {day.theme || 'Explore'}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-blue-50/85">
                {day.activities?.map((activity) => activity.listingName || activity.description).filter(Boolean).slice(0, 3).join(', ') || 'Curated activities and local discoveries.'}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="mx-3 mb-3 flex h-10 w-[calc(100%-1.5rem)] items-center justify-center rounded-xl border border-blue-300/30 bg-blue-500/20 text-xs font-bold text-blue-50 transition hover:bg-blue-500/30">
        View full itinerary
      </button>
    </div>
  );
};

const MapMiniPreview = ({ destination }: { destination: string }) => (
  <div className="relative h-full w-full overflow-hidden rounded-[14px] border border-white/15 bg-sky-100/90">
    <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 180 120" fill="none" preserveAspectRatio="none">
      <path d="M0 31C44 5 69 34 103 18C132 4 145 18 180 7V120H0V31Z" fill="#BAE6FD" />
      <path d="M10 91C48 70 79 69 116 89C140 102 158 90 178 78" stroke="#60A5FA" strokeWidth="5" strokeDasharray="6 8" opacity="0.85" />
      <path d="M20 22H162M28 47H150M18 75H160" stroke="#FFFFFF" strokeWidth="5" opacity="0.55" />
      <circle cx="126" cy="69" r="13" fill="#EF4444" opacity="0.95" />
      <circle cx="126" cy="69" r="5" fill="white" />
    </svg>
    <div className="absolute bottom-2 left-2 right-2 truncate rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
      {destination}
    </div>
  </div>
);

const TravelFallbackImage = ({ destination }: { destination: string }) => (
  <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-cyan-300/70 via-blue-500/70 to-violet-700/80">
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 420 220" fill="none">
      <circle cx="326" cy="54" r="32" fill="#FBBF24" opacity="0.9" />
      <path d="M0 126C71 78 141 82 216 120C290 158 345 130 420 87V220H0V126Z" fill="#BAE6FD" />
      <path d="M42 151C111 113 190 111 279 153" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
      <path d="M42 114L134 34L226 114H42Z" fill="#0F766E" opacity="0.72" />
      <path d="M185 122L280 42L374 122H185Z" fill="#0284C7" opacity="0.55" />
      <path d="M72 177C110 162 143 162 181 178" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
    </svg>
    <span className="sr-only">{destination}</span>
  </div>
);

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return undefined;
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  try {
    if (startDate && endDate) return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
    return formatter.format(new Date(startDate || endDate || ''));
  } catch {
    return startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate;
  }
};

const budgetStatusText = (budget?: ChatItinerary['budget']) => {
  if (!budget) return 'Estimate unavailable';
  const total = resolvedBudgetTotal(budget);
  if (!total) return 'Estimate unavailable';
  const withinBudget = budget.withinBudget ?? budget.feasible ?? (budget.requestedTotal ? total <= budget.requestedTotal : true);
  return withinBudget ? 'Within budget' : 'Adjustment needed';
};

const budgetStatusClass = (budget?: ChatItinerary['budget']) => {
  const total = resolvedBudgetTotal(budget);
  if (!budget || !total) return 'text-blue-100';
  const withinBudget = budget.withinBudget ?? budget.feasible ?? (budget.requestedTotal ? total <= budget.requestedTotal : true);
  return withinBudget ? 'text-emerald-200' : 'text-amber-200';
};

const SavedTripSuccessCard = ({ itinerary, trip }: { itinerary: ChatItinerary; trip: SavedTrip }) => {
  const detailPath = trip.detailPath || `/trips/${trip.slug}`;
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const savedDays = trip.days?.length
    ? trip.days.slice(0, 4).map((day) => ({
        day: day.dayNumber,
        title: day.title,
        summary: day.summary || day.activities?.slice(0, 3).map((activity) => activity.title).join(', ') || 'Curated trip activities.',
        image: day.imageUrl,
      }))
    : itinerary.days.slice(0, 4).map((day) => ({
        day: day.day,
        title: day.shortTitle || day.title,
        summary: day.description || day.morning || day.afternoon || day.evening || 'Curated trip activities.',
        image: day.image,
      }));
  const breakdown = Object.entries(itinerary.budget?.breakdown ?? {}).filter(([, value]) => typeof value === 'number' && value > 0) as Array<[string, number]>;

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[20px] border border-white/20 bg-slate-950/35 shadow-xl shadow-blue-950/30 backdrop-blur">
      <div className="border-b border-white/10 bg-emerald-400/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-emerald-950 shadow-lg shadow-emerald-950/20">
            <Check className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-black text-white">Trip added to your list</h4>
            <p className="mt-1 text-xs leading-5 text-emerald-50/85">"{trip.title}" has been saved successfully.</p>
          </div>
        </div>
        <a
          href="/my-trips"
          className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-[14px] border border-violet-300/35 bg-violet-500/15 px-3 py-2 text-left text-sm font-bold text-white transition hover:bg-violet-500/25 focus:outline-none focus:ring-2 focus:ring-violet-200"
        >
          <span className="min-w-0">
            <span className="block truncate">View in My Trips</span>
            <span className="block truncate text-xs font-medium text-violet-100/75">Your saved itinerary is ready.</span>
          </span>
          <span aria-hidden="true" className="text-lg text-violet-100">&gt;</span>
        </a>
      </div>

      <div className="space-y-4 p-4">
        <section aria-label="Trip overview" className="rounded-[16px] border border-white/10 bg-white/8 p-3">
          <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-blue-100/80">Trip overview</p>
          <div className="grid min-w-0 gap-3 min-[420px]:grid-cols-[92px_minmax(0,1fr)]">
            <div className="h-24 overflow-hidden rounded-[14px] bg-blue-600/40">
              {trip.heroImageUrl || itinerary.coverImage ? (
                <img src={trip.heroImageUrl || itinerary.coverImage} alt={trip.title} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <TravelFallbackImage destination={trip.destination} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h5 className="min-w-0 truncate text-[15px] font-black text-white">{trip.title}</h5>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-blue-100">{trip.status || 'UPCOMING'}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-blue-100/90">
                <span className="rounded-full bg-white/10 px-2 py-1">{trip.durationText || `${trip.durationDays || itinerary.durationDays}D / ${trip.durationNights ?? itinerary.nights ?? 0}N`}</span>
                <span className="rounded-full bg-white/10 px-2 py-1">{trip.travelerCount || itinerary.travelers || 1} travelers</span>
                {dateRange ? <span className="rounded-full bg-white/10 px-2 py-1">{dateRange}</span> : null}
              </div>
              <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-blue-50/80">{trip.summary || itinerary.summary}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                <span className="rounded-full bg-slate-950/30 px-2 py-1 text-blue-50">Budget: {formatMoney(trip.budget, trip.currency) || 'Not set'}</span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-200">Estimated: {formatMoney(safeAmount(trip.estimatedCost) || resolvedBudgetTotal(itinerary.budget, true), trip.currency || itinerary.budget?.currency) || 'Estimate unavailable'}</span>
              </div>
            </div>
          </div>
        </section>

        {savedDays.length > 0 ? (
          <section aria-label="Itinerary summary">
            <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-blue-100/80">Itinerary summary</p>
            <div className="space-y-2">
              {savedDays.map((day) => (
                <div key={`${day.day}-${day.title}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_72px] gap-3 rounded-[14px] border border-white/10 bg-white/8 p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white">Day {day.day}: {day.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-blue-100/75">{day.summary}</p>
                  </div>
                  <div className="h-14 overflow-hidden rounded-[10px] bg-white/10">
                    {day.image ? (
                      <img src={day.image} alt={`Day ${day.day} ${trip.destination}`} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-blue-100">
                        <Map className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-label="Estimated cost" className="rounded-[16px] border border-white/10 bg-white/8 p-3">
          <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-blue-100/80">Estimated cost</p>
          <div className="space-y-1.5 text-xs text-blue-50/85">
            {breakdown.slice(0, 5).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="capitalize text-blue-100/70">{label}</span>
                <span className="font-bold">{formatMoney(value, trip.currency || itinerary.budget?.currency) || 'Pending'}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-black text-emerald-200">
              <span>Total estimate</span>
              <span>{formatMoney(safeAmount(trip.estimatedCost) || resolvedBudgetTotal(itinerary.budget, true), trip.currency || itinerary.budget?.currency) || 'Estimate unavailable'}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-2 min-[420px]:grid-cols-2">
          <a href={detailPath} className="flex h-11 items-center justify-center rounded-[13px] border border-white/20 px-3 text-xs font-black text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-200">
            Edit trip
          </a>
          <a href={detailPath} className="flex h-11 items-center justify-center rounded-[13px] bg-gradient-to-r from-violet-500 to-blue-500 px-3 text-xs font-black text-white shadow-lg shadow-violet-950/30 transition hover:from-violet-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-violet-200">
            Start trip
          </a>
        </div>
      </div>
    </div>
  );
};

const CompactChatItineraryCard = ({
  itinerary,
  onSaveDraft,
  saving,
}: {
  itinerary: ChatItinerary;
  onSaveDraft?: (draftId: string) => void;
  saving?: boolean;
}) => {
  void ChatItineraryCard;
  if (itinerary.savedTrip) {
    return <SavedTripSuccessCard itinerary={itinerary} trip={itinerary.savedTrip} />;
  }

  const visibleDays = itinerary.days.slice(0, 4);
  const hiddenDayCount = Math.max(itinerary.days.length - visibleDays.length, 0);
  const recommendations = itinerary.recommendations?.filter(isDatabaseListing).slice(0, 3) ?? [];
  const requestedBudget = itinerary.budget?.requestedTotal ? formatMoney(itinerary.budget.requestedTotal, itinerary.budget.currency) : 'Flexible';
  const estimatedTotal = resolvedBudgetTotal(itinerary.budget, true);
  const estimatedCost = estimatedTotal
    ? formatMoney(estimatedTotal, itinerary.budget?.currency)
    : itinerary.estimatedBudget || formatBudget(itinerary.totalEstimatedBudget) || 'Estimate unavailable';

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[20px] border border-white/20 bg-white/10 shadow-xl shadow-blue-950/25 backdrop-blur">
      <div className="p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/18 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-200">
            <Sparkles className="h-3 w-3" />
            New trip
          </span>
          <span className="shrink-0 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-black text-blue-100">
            {itinerary.durationDays}D{itinerary.nights !== undefined ? ` / ${itinerary.nights}N` : ''}
          </span>
        </div>

        <div className="grid min-w-0 gap-3 min-[430px]:grid-cols-[150px_minmax(0,1fr)]">
          <div className="h-40 min-w-0 overflow-hidden rounded-[16px] bg-blue-600/50 min-[430px]:h-36">
            {itinerary.coverImage ? (
              <img src={itinerary.coverImage} alt={`${itinerary.destination} destination`} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <TravelFallbackImage destination={itinerary.destination} />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-[18px] font-black leading-tight text-white">{itinerary.title || `${itinerary.destination} Getaway`}</h4>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-blue-100/90">
              <span className="rounded-full bg-white/10 px-2 py-1">{itinerary.durationDays}D{itinerary.nights !== undefined ? ` / ${itinerary.nights}N` : ''}</span>
              {itinerary.travelers ? <span className="rounded-full bg-white/10 px-2 py-1">{itinerary.travelers} travelers</span> : null}
              {itinerary.bestTime ? <span className="rounded-full bg-white/10 px-2 py-1">{itinerary.bestTime}</span> : null}
            </div>
            <p className="mt-2 line-clamp-4 text-[12px] leading-5 text-blue-50/85 sm:text-[13px]">{itinerary.summary}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 min-[420px]:grid-cols-3">
          {[
            ['Requested budget', requestedBudget],
            ['Estimated cost', estimatedCost || 'Pending'],
            ['Budget status', budgetStatusText(itinerary.budget)],
          ].map(([label, value], index) => (
            <div key={label} className="min-w-0 rounded-[14px] border border-white/10 bg-slate-950/20 px-3 py-2.5">
              <p className="truncate text-[10px] font-semibold text-blue-100/65">{label}</p>
              <p className={`mt-1 truncate text-xs font-black ${index === 2 ? budgetStatusClass(itinerary.budget) : 'text-white'}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-2 px-3.5 pb-3.5 min-[420px]:grid-cols-3">
        {visibleDays.map((day, index) => (
          <div key={`${day.day}-${day.title}`} className="min-w-0 overflow-hidden rounded-[14px] border border-white/15 bg-white/8 p-2.5">
            <div className="mb-2 h-16 overflow-hidden rounded-[10px] bg-white/10 min-[420px]:h-12">
              {day.image ? (
                <img src={day.image} alt={`${itinerary.destination} day ${day.day}`} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-blue-100">
                  <Map className="h-4 w-4" />
                </div>
              )}
            </div>
            <p className="text-[10px] font-black text-blue-100">Day {day.day}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-4 text-white">{day.shortTitle || day.title}</p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-blue-100/75">{day.description || day.morning || day.afternoon}</p>
            {hiddenDayCount > 0 && index === visibleDays.length - 1 ? (
              <p className="mt-1 text-[10px] font-bold text-cyan-200">+{hiddenDayCount} days</p>
            ) : null}
          </div>
        ))}
      </div>

      {recommendations.length > 0 ? (
        <div className="mx-3 mb-3 grid min-w-0 gap-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-cyan-100/90">
            <Sparkles className="h-3.5 w-3.5" />
            Marketplace picks
          </div>
          <div className="grid min-w-0 gap-2">
            {recommendations.map((item) => {
              const detailPath = getListingDetailPath(item);
              const content = (
                <>
                  <div className="h-11 overflow-hidden rounded-[10px] bg-white/10">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-blue-100">
                        <Hotel className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[12px] font-bold text-white">{item.name}</p>
                      {item.category ? <span className="shrink-0 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[9px] font-bold text-cyan-100">{item.category}</span> : null}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-blue-100/75">{item.location || item.priceText || 'Marketplace listing'}</p>
                    <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2 text-[10px] text-blue-50/80">
                      {item.priceText ? <span className="min-w-0 truncate font-semibold">{item.priceText}</span> : <span />}
                      {item.ratingText ? <span className="shrink-0">{item.ratingText}</span> : null}
                    </div>
                  </div>
                </>
              );
              const className = "grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-2 rounded-[12px] border border-white/10 bg-slate-950/20 p-2 transition hover:border-cyan-200/40 hover:bg-white/12";
              return detailPath ? (
                <a key={item.id ?? item.name} href={detailPath} className={className}>
                  {content}
                </a>
              ) : (
                <div key={item.id ?? item.name} className={`${className} cursor-not-allowed opacity-75`} aria-disabled="true">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mx-3 mb-3 min-w-0 overflow-hidden rounded-[14px]">
        <div className="aspect-[16/7] w-full">
          {itinerary.mapImage ? (
            <img src={itinerary.mapImage} alt={itinerary.mapLabel || itinerary.destination} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <MapMiniPreview destination={itinerary.mapLabel || itinerary.destination} />
          )}
        </div>
      </div>

      <div className="grid gap-2 border-t border-white/15 px-3.5 py-3 min-[420px]:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <button type="button" className="flex h-11 min-w-0 items-center justify-center rounded-[13px] border border-white/20 px-3 text-[12px] font-black text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-200">
          View full itinerary
        </button>
        {itinerary.supportsTripSave && itinerary.draftId ? (
          <button
            type="button"
            onClick={() => onSaveDraft?.(itinerary.draftId!)}
            disabled={saving}
            className="flex h-11 min-w-0 items-center justify-center rounded-[13px] bg-gradient-to-r from-violet-500 to-blue-500 px-3 text-[12px] font-black text-white shadow-lg shadow-violet-950/30 transition hover:from-violet-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Adding trip...' : 'Add to my trips'}
          </button>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button type="button" aria-label="Helpful itinerary" className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" aria-label="Not helpful itinerary" className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10">
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {itinerary.supportsTripSave && itinerary.draftId ? (
          <div className="flex items-center justify-center gap-1 min-[420px]:col-span-2">
            <button type="button" aria-label="Helpful itinerary" className="flex h-7 w-7 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" aria-label="Not helpful itinerary" className="flex h-7 w-7 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10">
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ChatItinerarySkeleton = () => (
  <div className="flex w-full min-w-0 justify-start">
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[18px] border border-white/12 bg-white/10 p-2.5 shadow-xl shadow-blue-950/20">
      <div className="grid min-w-0 grid-cols-[96px_minmax(0,1fr)] gap-3">
        <div className="aspect-square w-full max-w-[96px] animate-pulse rounded-[14px] bg-white/15" />
        <div className="space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/15" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <div className="mt-3 flex w-full min-w-0 gap-2 overflow-x-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="w-[112px] min-w-[112px] max-w-[112px] shrink-0 space-y-1.5 rounded-[14px] bg-slate-950/20 p-2.5">
            <div className="h-12 animate-pulse rounded-[10px] bg-white/10" />
            <div className="h-2.5 animate-pulse rounded-full bg-white/10" />
            <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-white/10" />
          </div>
        ))}
      </div>
      <div className="mt-3 aspect-[16/7] w-full animate-pulse rounded-[14px] bg-white/10" />
    </div>
  </div>
);

const formatListingPrice = (listing: any) => {
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

const hydrateTravelContext = (messages: TravelChatMessage[]): Record<string, unknown> => {
  return (
    [...messages]
      .reverse()
      .find((message) => message.extractedContext && Object.keys(message.extractedContext).length > 0)
      ?.extractedContext || {}
  );
};

const CompactRecommendationCards = ({ recommendations }: { recommendations: AssistantListingRecommendation[] }) => {
  const databaseRecommendations = recommendations.filter(isDatabaseListing).slice(0, 4);
  if (!databaseRecommendations.length) {
    return null;
  }
  return (
  <div className="motion-fade-up w-full min-w-0 overflow-hidden rounded-[18px] border border-white/12 bg-white/10 p-3 shadow-xl shadow-blue-950/20">
    <div className="mb-3 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-cyan-200" />
      <h4 className="text-sm font-bold text-white">Marketplace matches</h4>
    </div>
    <div className="grid gap-2">
      {databaseRecommendations.map((recommendation) => {
        const listing = recommendation;
        const image = getListingImage(recommendation) || recommendation.imageUrl;
        const title = listing.title || listing.name || 'Marketplace listing';
        const location = listing.location || [listing.city, listing.country].filter(Boolean).join(', ') || 'Location available in details';
        const price = listing.priceText || formatListingPrice(listing);
        const rating = listing.ratingText || (listing.averageRating ? `★ ${listing.averageRating} (${listing.reviewCount || 0})` : 'No reviews');
        const href = getListingDetailPath(listing);
        const cardContent = (
          <>
            <div className="h-14 overflow-hidden rounded-xl bg-white/10">
              {image ? (
                <img src={image} alt={title} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-blue-100">
                  <Hotel className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-bold text-white">{title}</p>
                <span className="shrink-0 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-100">{listing.category || 'Travel'}</span>
              </div>
              <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[11px] text-blue-100/80">
                <Pin className="h-3 w-3 shrink-0" />
                {location}
              </p>
              <div className="mt-1 flex min-w-0 items-center justify-between gap-2 text-[11px]">
                <span className="truncate font-semibold text-white">{price}</span>
                <span className="shrink-0 text-blue-100/75">{rating}</span>
              </div>
              {recommendation.reasoning || listing.shortDescription ? <p className="mt-1 text-[11px] leading-4 text-blue-50/75">✨ {recommendation.reasoning || listing.shortDescription}</p> : null}
            </div>
          </>
        );
        const className = "grid min-w-0 grid-cols-[58px_minmax(0,1fr)] gap-3 rounded-[14px] border border-white/10 bg-slate-950/20 p-2 transition hover:border-cyan-200/40 hover:bg-white/12";
        return (
          href ? (
            <a key={listing.id ?? `${title}-${recommendation.rank ?? ''}`} href={href} className={className}>
              {cardContent}
            </a>
          ) : (
            <div key={listing.id ?? `${title}-${recommendation.rank ?? ''}`} className={`${className} cursor-not-allowed opacity-75`} aria-disabled="true">
              {cardContent}
            </div>
          )
        );
      })}
    </div>
  </div>
  );
};

const AttachmentPreview = ({ attachments, onRemove }: { attachments: ChatAttachment[]; onRemove: (id: string) => void }) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="motion-upload-preview relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10">
          <img src={attachment.previewUrl} alt={attachment.file.name} className="h-full w-full object-cover" />
          {attachment.status === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-red-500"
            aria-label={`Remove ${attachment.file.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

const TravelMessage = ({
  message,
  onSaveDraft,
  savingDraftId,
}: {
  message: TravelChatMessage;
  onSaveDraft?: (messageId: string, draftId: string) => void;
  savingDraftId?: string | null;
}) => {
  const isUser = message.role === 'user';
  if (!isUser && (message.type === 'ITINERARY' || message.kind === 'ITINERARY') && (message.itineraryCard || message.itinerary)) {
    const itinerary = message.itineraryCard || normalizeTripPlanForChat(message.itinerary as TripPlanResponse, message.images);
    return (
      <div className="motion-fade-up flex w-full min-w-0 justify-start">
        <div className="w-full min-w-0 max-w-full">
          <CompactChatItineraryCard
            itinerary={{ ...itinerary, savedTrip: message.savedTrip }}
            onSaveDraft={(draftId) => onSaveDraft?.(message.id, draftId)}
            saving={Boolean(itinerary.draftId && savingDraftId === itinerary.draftId)}
          />
          <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-200/70">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isUser && (message.type === 'RECOMMENDATIONS' || message.kind === 'LISTING_RECOMMENDATIONS') && message.recommendations?.length) {
    return (
      <div className="motion-fade-up flex w-full min-w-0 justify-start">
        <div className="w-full min-w-0 max-w-full">
          <CompactRecommendationCards recommendations={message.recommendations} />
          <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-200/70">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isUser && message.type === 'FLIGHT_RECOMMENDATIONS' && message.flights?.length) {
    return (
      <div className="motion-fade-up flex w-full min-w-0 justify-start">
        <div className="w-full min-w-0 max-w-full">
          {message.content ? (
            <div className="mb-3 max-w-[92%] rounded-2xl rounded-tl-md border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-blue-50 shadow-sm backdrop-blur">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : null}
          {message.summaryLabels && <FlightSummaryLabels labels={message.summaryLabels} />}
          <div className="flex flex-col gap-3">
            {message.flights.map((flight, idx) => (
              <FlightOfferCard key={idx} flight={flight} language={(message.extractedContext?.language as string) || 'en'} />
            ))}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-200/70">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isUser && message.type === 'FLIGHT_DATE_RECOMMENDATIONS' && message.dateRecommendations?.length) {
    return (
      <div className="motion-fade-up flex w-full min-w-0 justify-start">
        <div className="w-full min-w-0 max-w-full">
          {message.content ? (
            <div className="mb-3 max-w-[92%] rounded-2xl rounded-tl-md border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-blue-50 shadow-sm backdrop-blur">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            {message.dateRecommendations.map((deal, idx) => (
              <FlightDealCard key={idx} deal={deal} language={(message.extractedContext?.language as string) || 'en'} />
            ))}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-200/70">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`motion-fade-up flex w-full min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`min-w-0 ${isUser ? 'ml-auto max-w-[84%]' : 'mr-auto w-full max-w-full sm:max-w-[92%]'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
            isUser
              ? 'rounded-tr-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-950/20'
              : 'rounded-tl-md border border-white/10 bg-white/10 text-blue-50 backdrop-blur'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {message.attachments.slice(0, 4).map((attachment) => (
                <img
                  key={attachment.id}
                  src={attachment.uploadedUrl || attachment.previewUrl}
                  alt="Uploaded travel context"
                  loading="lazy"
                  className="h-20 w-full rounded-xl object-cover"
                />
              ))}
            </div>
          )}
        </div>
        <div className={`mt-1 flex items-center gap-1 text-[10px] text-blue-200/70 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isUser && <Check className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
};

export const TravelAiChat: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const accountOwnerId = user?.id ?? null;
  const accountOwnerKey = getChatStorageKey(accountOwnerId);
  const rootRef = useRef<HTMLDivElement>(null);
  const accountOwnerRef = useRef(accountOwnerKey);
  const previousOwnerKeyRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const [chatState, setChatState] = useState<ChatTransitionState>('closed');
  const [launcherCompress, setLauncherCompress] = useState(false);
  const [launcherPortalActive, setLauncherPortalActive] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [requestError, setRequestError] = useState(false);
  const [lastCompletedMessageId, setLastCompletedMessageId] = useState<string>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingResponseKind, setPendingResponseKind] = useState<'TEXT' | 'ITINERARY' | 'LISTING_RECOMMENDATIONS' | null>(null);
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>(suggestionChips);
  const [messages, setMessages] = useState<TravelChatMessage[]>(() => [createGreetingMessage()]);
  const [messagesOwnerKey, setMessagesOwnerKey] = useState(accountOwnerKey);
  const [travelContext, setTravelContext] = useState<Record<string, unknown>>({});

  const ownerScopedMessages = useMemo(
    () => messagesOwnerKey === accountOwnerKey ? messages : [createGreetingMessage(user?.fullName?.split(' ')[0])],
    [accountOwnerKey, messages, messagesOwnerKey, user?.fullName]
  );
  const history = useMemo<AssistantMessage[]>(() => ownerScopedMessages.map(({ role, content }) => ({ role, content })), [ownerScopedMessages]);
  const reducedMotion = useReducedMotion();
  const isVisible = chatState !== 'closed';
  const robotMood = useRobotMood({
    isSending: isLoading,
    error: requestError,
    lastCompletedMessageId,
  });
  const canSend = input.trim().length > 0 || attachments.length > 0;

  const latestDraftMessage = useMemo(
    () => [...ownerScopedMessages].reverse().find((message) => message.itineraryCard?.draftId && !message.savedTrip),
    [ownerScopedMessages]
  );

  const saveTripDraft = async (messageId: string, draftId: string) => {
    if (savingDraftId) return;
    const requestOwnerKey = accountOwnerRef.current;
    setSavingDraftId(draftId);
    setRequestError(false);
    try {
      const result = await aiService.confirmTripDraft(draftId);
      if (requestOwnerKey !== accountOwnerRef.current) return;
      setMessages((current) => current.map((message) => {
        if (message.id !== messageId) return message;
        return {
          ...message,
          savedTrip: result.trip,
          itineraryCard: message.itineraryCard ? { ...message.itineraryCard, savedTrip: result.trip } : message.itineraryCard,
        };
      }));
      await queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      await queryClient.invalidateQueries({ queryKey: ['trip-detail', result.trip.slug] });
      setSuggestedActions(['View in My Trips', 'Continue editing']);
    } catch (error) {
      if (requestOwnerKey !== accountOwnerRef.current) return;
      console.error('Failed to save AI trip draft:', error);
      setRequestError(true);
      setMessages((current) => [
        ...current,
        createMessage('assistant', 'I could not add that trip to My Trips yet. Please try again.', undefined, {
          type: 'ERROR',
          kind: 'ERROR',
        }),
      ]);
    } finally {
      if (requestOwnerKey === accountOwnerRef.current) {
        setSavingDraftId(null);
      }
    }
  };

  const resizeComposer = (node: HTMLTextAreaElement) => {
    node.style.height = '42px';
    node.style.height = `${Math.min(node.scrollHeight, 104)}px`;
  };

  const clearFocusTimer = () => {
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const clearSensitiveAiQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['ai-conversations'] });
    queryClient.removeQueries({ queryKey: ['ai-conversation'] });
    queryClient.removeQueries({ queryKey: ['ai-trip-draft'] });
    queryClient.removeQueries({ queryKey: ['my-trips'] });
    queryClient.removeQueries({ queryKey: ['trip-detail'] });
  }, [queryClient]);

  const resetAiChatState = useCallback((storageKey: string, fallbackName?: string) => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setIsLoading(false);
    setRequestError(false);
    setUploadError('');
    setInput('');
    setPendingResponseKind(null);
    setSavingDraftId(null);
    setSuggestedActions(suggestionChips);
    setUnreadCount(0);
    setLastCompletedMessageId(undefined);
    setAttachments((current) => {
      current.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
      return [];
    });
    const nextMessages = hydrateMessages(storageKey, fallbackName);
    setMessages(nextMessages);
    setMessagesOwnerKey(storageKey);
    setTravelContext(hydrateTravelContext(nextMessages));
    if (textareaRef.current) textareaRef.current.style.height = '42px';
    clearSensitiveAiQueries();
  }, [clearSensitiveAiQueries]);

  const startLauncherCompress = () => {
    if (reducedMotion) return;
    setLauncherCompress(true);
    setTimeout(() => {
      setLauncherCompress(false);
    }, 130);
  };

  const runPortalPulse = () => {
    if (reducedMotion) return;
    setLauncherPortalActive(true);
    setTimeout(() => {
      setLauncherPortalActive(false);
    }, 720);
  };

  useEffect(() => {
    accountOwnerRef.current = accountOwnerKey;
  }, [accountOwnerKey]);

  useEffect(() => {
    if (authLoading) return;
    const previousOwnerKey = previousOwnerKeyRef.current;
    if (previousOwnerKey === accountOwnerKey) return;

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      if (previousOwnerKey && previousOwnerKey !== accountOwnerKey) {
        window.localStorage.removeItem(previousOwnerKey);
      }
    }

    previousOwnerKeyRef.current = accountOwnerKey;
    resetAiChatState(accountOwnerKey, user?.fullName?.split(' ')[0]);
  }, [accountOwnerKey, authLoading, resetAiChatState, user?.fullName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, isVisible]);

  useEffect(() => {
    if (typeof window === 'undefined' || authLoading || messagesOwnerKey !== accountOwnerKey) return;
    const serializable = messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map((attachment) => ({
        id: attachment.id,
        uploadedUrl: attachment.uploadedUrl,
        previewUrl: attachment.uploadedUrl || attachment.previewUrl,
      })),
    }));
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
    window.localStorage.setItem(accountOwnerKey, JSON.stringify({
      ownerKey: accountOwnerKey,
      messages: serializable,
    }));
  }, [accountOwnerKey, authLoading, messages, messagesOwnerKey]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeChat();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isVisible]);

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
    };
  }, [attachments]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      clearFocusTimer();
      requestControllerRef.current?.abort();
    };
  }, []);

  const openChat = () => {
    if (chatState === 'opening' || chatState === 'closing') return;
    if (isVisible) {
      closeChat();
      return;
    }
    startLauncherCompress();
    runPortalPulse();
    clearCloseTimer();
    clearFocusTimer();
    setChatState('opening');
    setUnreadCount(0);
    focusTimerRef.current = setTimeout(() => {
      panelRef.current?.focus({ preventScroll: true });
      focusTimerRef.current = null;
    }, reducedMotion ? 90 : 520);
    closeTimerRef.current = setTimeout(() => {
      setChatState('open');
      closeTimerRef.current = null;
    }, reducedMotion ? 90 : 720);
  };

  const closeChat = () => {
    if (chatState === 'closed' || chatState === 'opening' || chatState === 'closing') return;
    clearCloseTimer();
    clearFocusTimer();
    setChatState('closing');
    closeTimerRef.current = setTimeout(() => {
      setChatState('closed');
      closeTimerRef.current = null;
      setTimeout(() => launcherButtonRef.current?.focus(), 0);
    }, reducedMotion ? 90 : 620);
  };

  const minimizeChat = () => {
    closeChat();
  };

  const validateFiles = (files: File[]) => {
    setUploadError('');
    const room = MAX_IMAGES - attachments.length;
    const valid = files.slice(0, room).filter((file) => {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files can be attached.');
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setUploadError('Images must be 5MB or smaller.');
        return false;
      }
      return true;
    });

    if (files.length > room) setUploadError(`You can attach up to ${MAX_IMAGES} images.`);
    return valid;
  };

  const addFiles = (fileList: FileList | File[]) => {
    const files = validateFiles(Array.from(fileList));
    if (!files.length) return;
    const next = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'local' as const,
    }));
    setAttachments((current) => [...current, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((attachment) => attachment.id !== id);
    });
  };

  const uploadAttachments = async () => {
    const uploaded: ChatAttachment[] = [];
    for (const attachment of attachments) {
      setAttachments((current) => current.map((item) => (item.id === attachment.id ? { ...item, status: 'uploading', progress: 35 } : item)));
      try {
        const response = await storageService.uploadImage(attachment.file, 'chat');
        const uploadedUrl = response.data;
        const next = { ...attachment, uploadedUrl, status: 'uploaded' as const, progress: 100 };
        uploaded.push(next);
        setAttachments((current) => current.map((item) => (item.id === attachment.id ? next : item)));
      } catch (error) {
        console.error('Failed to upload chat image:', error);
        setAttachments((current) => current.map((item) => (item.id === attachment.id ? { ...item, status: 'error', progress: 0 } : item)));
        throw new Error('Image upload failed. Please remove it or try again.');
      }
    }
    return uploaded;
  };

  const sendMessage = async (text = input) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    const requestOwnerKey = accountOwnerRef.current;
    const requestOwnerId = accountOwnerId;
    const trimmedText = text.trim();
    if (trimmedText && isTripSaveConfirmation(trimmedText)) {
      const userMessage = createMessage('user', trimmedText);
      setMessages((current) => [...current, userMessage]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = '42px';
      if (latestDraftMessage?.itineraryCard?.draftId) {
        await saveTripDraft(latestDraftMessage.id, latestDraftMessage.itineraryCard.draftId);
      } else {
        setMessages((current) => [
          ...current,
          createMessage('assistant', 'I do not have an active trip preview to save yet. Tell me where you want to go and I will prepare one first.', undefined, {
            type: 'CLARIFICATION',
          }),
        ]);
      }
      return;
    }
    const destination = extractDestination(trimmedText);
    const conversationalOnly = isConversationalPrompt(trimmedText);
    const hasTravelContext = !conversationalOnly && Boolean(destination || travelContext.destination || travelContext.responseMode);
    const wantsItinerary = !conversationalOnly && (isTripPlanningPrompt(trimmedText) || (hasTravelContext && /cheaper|more food|near the beach|what should|what to do|ideas|weekend|wife|people|re hon|them mon an/i.test(normalizePromptText(trimmedText))));
    const wantsRecommendations = !conversationalOnly && !wantsItinerary && (isListingRecommendationPrompt(trimmedText) || hasTravelContext);
    const responseKind = conversationalOnly ? 'TEXT' : wantsItinerary ? 'ITINERARY' : wantsRecommendations ? 'LISTING_RECOMMENDATIONS' : 'TEXT';
    const controller = new AbortController();
    requestControllerRef.current?.abort();
    requestControllerRef.current = controller;
    setIsLoading(true);
    setRequestError(false);
    setPendingResponseKind(responseKind);
    setUploadError('');

    try {
      const uploaded = await uploadAttachments();
      if (requestOwnerKey !== accountOwnerRef.current || controller.signal.aborted) return;
      const uploadedUrls = uploaded.map((attachment) => attachment.uploadedUrl).filter(Boolean);
      const inferredBudget = extractBudget(trimmedText);
      const inferredCategories = inferCategories(trimmedText);
      const inferredDuration = wantsItinerary ? extractDuration(trimmedText) : undefined;
      const hintLines = [
        destination ? `Destination hint: ${destination}` : '',
        inferredDuration ? `Duration hint: ${inferredDuration} days` : '',
        inferredBudget ? `Budget hint: ${inferredBudget} VND` : '',
        inferredCategories?.length ? `Category hints: ${inferredCategories.join(', ')}` : '',
      ].filter(Boolean);
      const messageContent = [
        trimmedText || 'Please review these travel images.',
        hintLines.length ? `Travel context hints:\n${hintLines.join('\n')}` : '',
        uploadedUrls.length ? `Attached image URLs:\n${uploadedUrls.join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const userMessage = createMessage(
        'user',
        trimmedText || 'Please review these travel images.',
        uploaded.map(({ id, previewUrl, uploadedUrl }) => ({ id, previewUrl, uploadedUrl }))
      );
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = '42px';
      setAttachments([]);
      setSuggestedActions([]);

      const response = await aiService.chatWithAssistant(
        {
          message: messageContent,
          history: history.slice(-12),
          historyOwnerId: requestOwnerId,
          contextDestination: destination,
          extractedContext: travelContext,
        },
        controller.signal
      );
      if (requestOwnerKey !== accountOwnerRef.current || controller.signal.aborted) return;
      const aiMessage = normalizeAssistantResponse(response);
      if (response.extractedContext) {
        setTravelContext(response.extractedContext);
      }
      const nextSuggestions = response.itineraryCard?.followUpSuggestions || response.suggestions || response.suggestedActions || [];
      setSuggestedActions(nextSuggestions.length ? nextSuggestions : suggestionChips);
      setMessages([...nextMessages, aiMessage]);
      setLastCompletedMessageId(aiMessage.id);
      if (aiMessage.kind === 'ITINERARY') {
        setSuggestedActions(aiMessage.itineraryCard?.followUpSuggestions?.length ? aiMessage.itineraryCard.followUpSuggestions : ['Adjust this for a lower budget', 'Add more food stops', 'Make it family-friendly']);
      }
      if (!isVisible) setUnreadCount((count) => count + 1);
    } catch (error) {
      if ((error as any)?.name === 'CanceledError' || (error as any)?.code === 'ERR_CANCELED') return;
      if (requestOwnerKey !== accountOwnerRef.current) return;
      console.error('Failed to send chat message:', error);
      setRequestError(true);
      setUploadError(error instanceof Error ? error.message : 'The AI concierge could not respond right now.');
      setMessages((current) => [...current, createMessage('assistant', 'Sorry, I could not connect to the travel concierge right now. Please try again.')]);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
      if (requestOwnerKey === accountOwnerRef.current) {
        setIsLoading(false);
        setPendingResponseKind(null);
      }
    }
  };

  const sendQuickAction = (title: string) => {
    const promptMap: Record<string, string> = {
      'Plan a trip': 'Plan a relaxing 4-day trip with stays, food, and local highlights.',
      'Find hotels': 'Find hotels that match my travel style and budget.',
      'Build itinerary': 'Build a day-by-day itinerary with routes and timing.',
      'Ask about visa': 'What visa or entry rules should I check before traveling?',
    };
    sendMessage(promptMap[title] || title);
  };

  const smoothEase = [0.16, 1, 0.3, 1] as const;
  const exitEase = [0.4, 0, 0.2, 1] as const;
  const handoffEase = [0.22, 1, 0.36, 1] as const;

  const panelVariants: Variants = {
    hidden: reducedMotion
      ? { opacity: 0 }
      : {
          opacity: 0.7,
          y: 12,
          clipPath: 'inset(92% 0 0 92% round 999px)',
        },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0% 0% 0% 0% round 28px)',
      transition: reducedMotion ? { duration: 0.08 } : { duration: 0.46, delay: 0.08, ease: handoffEase },
    },
    closing: (delayCollapse = false) =>
      reducedMotion
        ? { opacity: 0, transition: { duration: 0.08 } }
        : {
            opacity: 0.65,
            y: 22,
            clipPath: 'inset(92% 0 0 92% round 999px)',
            transition: { duration: 0.34, delay: delayCollapse ? 0.16 : 0, ease: exitEase },
          },
  };

  const headerRobotVariants: Variants = {
    hidden: reducedMotion
      ? { opacity: 1, scale: 1 }
      : {
          opacity: 0,
          scale: 0.75,
          y: 4,
        },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: reducedMotion ? { duration: 0 } : { duration: 0.18, delay: 0.28, ease: handoffEase },
    },
    closing: reducedMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          scale: 0.78,
          rotate: [0, -4, 3, 0],
          transition: { opacity: { duration: 0.12, delay: 0.18 }, scale: { duration: 0.16, delay: 0.18 }, rotate: { duration: 0.2, ease: exitEase } },
        },
  };

  const revealVariants: Variants = {
    hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: reducedMotion ? { duration: 0 } : { duration: 0.28, delay, ease: smoothEase },
    }),
    closing: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, transition: { duration: 0.14 } },
  };

  const robotVariants: Variants = {
    idle: { y: 0, rotate: 0, scale: 1 },
    activate: reducedMotion
      ? { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
      : {
          x: -10,
          y: -6,
          rotate: -3,
          scale: [1, 0.94, 1.03],
          opacity: [1, 1, 0],
          transition: { duration: 0.28, ease: handoffEase },
        },
    return: reducedMotion
      ? { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
      : {
          opacity: [0, 1],
          x: [-8, 0],
          y: [-4, 0],
          rotate: [-3, 0],
          scale: [0.94, 1],
          transition: { duration: 0.22, delay: 0.38, ease: handoffEase },
        },
  };

  const panel = (
    <div className="pointer-events-none fixed inset-0 z-[1000]">
        <AnimatePresence mode="popLayout">
          {chatState !== 'closed' && (
            <motion.section
          key="travel-ai-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Travel AI Concierge"
          tabIndex={-1}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={`travel-ai-motion-panel travel-ai-panel-state--${chatState} pointer-events-auto fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] flex h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] origin-bottom-right flex-col overflow-hidden rounded-[28px] border border-blue-400/40 bg-[#071633] text-white shadow-2xl shadow-blue-950/50 ring-1 ring-violet-400/30 sm:inset-auto sm:bottom-[92px] sm:right-5 sm:h-[min(680px,calc(100dvh-130px))] sm:max-h-[calc(100dvh-130px)] sm:w-[clamp(360px,27vw,430px)]`}
          style={{ transformOrigin: 'bottom right' }}
          variants={panelVariants}
          initial="hidden"
          animate={chatState === 'closing' ? 'closing' : 'visible'}
          exit="hidden"
          custom={chatState === 'closing'}
        >
          {!reducedMotion && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 z-30 h-px bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]"
              initial={{ top: '0%', opacity: 0 }}
              animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.7, delay: 0.34, ease: 'easeInOut' }}
            />
          )}
          {!reducedMotion && <div aria-hidden="true" className="travel-ai-border-sweep" />}
          {!reducedMotion && <div aria-hidden="true" className="travel-ai-pull-beam" />}
          <motion.div
            className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-4 py-4"
            variants={revealVariants}
            initial="hidden"
            animate={chatState === 'closing' ? 'closing' : 'visible'}
            custom={0.39}
          >
            <div aria-hidden="true" className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <motion.div
                  className="travel-ai-header-robot relative"
                  variants={headerRobotVariants}
                  initial="hidden"
                  animate={chatState === 'closing' ? 'closing' : 'visible'}
                >
                  <TravelLauncherRobot mood={robotMood} hasUnread={false} pressed={false} portalActive={false} />
                  <Sparkles aria-hidden="true" className="travel-ai-header-sparkle absolute -right-1 -top-1 h-3.5 w-3.5 text-cyan-100" />
                </motion.div>
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 truncate text-base font-bold">
                    Travel AI Concierge <Sparkles className="h-4 w-4 text-violet-200" />
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-blue-100">
                    <span className="travel-ai-online-dot mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    Online - AI-powered
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10" aria-label="Pin chat">
                  <Pin className="h-4 w-4" />
                </button>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10" aria-label="Conversation history">
                  <History className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={minimizeChat}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10"
                  aria-label="Minimize chat"
                >
                  <Clock3 className="h-4 w-4" />
                </button>
                <button type="button" onClick={closeChat} className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10" aria-label="Close chat">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.18),transparent_34%),linear-gradient(180deg,rgba(15,39,92,0.9),rgba(7,22,51,1))] px-4 py-4 pb-8 [scrollbar-width:thin]"
            variants={revealVariants}
            initial="hidden"
            animate={chatState === 'closing' ? 'closing' : 'visible'}
            custom={0.48}
          >
            <motion.div variants={revealVariants} initial="hidden" animate={chatState === 'closing' ? 'closing' : 'visible'} custom={0.42} className="mb-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-blue-50 shadow-sm">
              Hi {user?.fullName?.split(' ')[0] || 'there'}! I'm your AI travel concierge. How can I help plan your next adventure?
            </motion.div>
            <motion.div variants={revealVariants} initial="hidden" animate={chatState === 'closing' ? 'closing' : 'visible'} custom={0.5} className="mb-4 grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => sendQuickAction(action.title)}
                  className={`rounded-2xl border border-white/10 bg-gradient-to-br ${action.tone} p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-white/20 active:scale-[0.98]`}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <action.icon className="mb-3 h-5 w-5" />
                  <p className="text-sm font-bold text-white">{action.title}</p>
                  <p className="mt-1 text-xs leading-5 text-blue-100">{action.helper}</p>
                </button>
              ))}
            </motion.div>
            <div className="min-w-0 space-y-4">
              {ownerScopedMessages.slice(1).map((message) => (
                <TravelMessage
                  key={message.id}
                  message={message}
                  onSaveDraft={saveTripDraft}
                  savingDraftId={savingDraftId}
                />
              ))}
              {isLoading && pendingResponseKind === 'ITINERARY' && <ChatItinerarySkeleton />}
              {isLoading && pendingResponseKind !== 'ITINERARY' && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-blue-100">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-200 [animation-delay:-120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-200 [animation-delay:-60ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-200" />
                    </span>
                    {pendingResponseKind === 'LISTING_RECOMMENDATIONS' ? 'Searching marketplace data...' : 'Building your response...'}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>

          <motion.div
            className="border-t border-white/10 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-3"
            variants={revealVariants}
            initial="hidden"
            animate={chatState === 'closing' ? 'closing' : 'visible'}
            custom={0.58}
          >
            {isDragging && <div className="mb-2 rounded-2xl border border-dashed border-cyan-300/70 bg-cyan-300/10 px-3 py-2 text-center text-xs font-bold text-cyan-100">Drop travel images here</div>}
            <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />
            {uploadError && <p className="mb-2 px-2 text-xs font-semibold text-rose-200">{uploadError}</p>}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/8 p-2 shadow-inner focus-within:border-blue-300/50"
            >
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => event.target.files && addFiles(event.target.files)} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10" aria-label="Attach image">
                <Paperclip className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10" aria-label="Pick image">
                <Image className="h-4 w-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  resizeComposer(event.target);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask about trips, hotels, food, routes..."
                className="min-h-[42px] max-h-[104px] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-blue-100/55 focus:ring-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              />
              <button
                type="submit"
                disabled={!canSend || isLoading}
                className="travel-ai-send-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white shadow-lg shadow-violet-950/30 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
            <motion.div variants={revealVariants} initial="hidden" animate={chatState === 'closing' ? 'closing' : 'visible'} custom={0.62} className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {suggestedActions.slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-white/14"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </motion.section>
          )}
        </AnimatePresence>

      <motion.button
        ref={launcherButtonRef}
        type="button"
        onClick={openChat}
        className={`travel-ai-launcher pointer-events-auto fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[max(12px,env(safe-area-inset-right))] z-[1001] flex h-14 w-14 max-w-[calc(100%_-_24px)] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-2xl shadow-blue-950/40 ring-4 ring-blue-400/20 sm:right-4 md:h-16 md:w-16 lg:bottom-5 lg:right-5 ${launcherPortalActive ? 'travel-ai-launcher--portal' : ''} ${launcherCompress ? 'travel-ai-launcher--compress' : ''}`}
        aria-label="Open Travel AI Concierge"
        aria-expanded={isVisible}
        initial={false}
        animate={chatState === 'open' || chatState === 'closing' ? { scale: 0.96 } : { scale: 1 }}
        whileHover={reducedMotion ? undefined : { scale: chatState === 'closed' ? 1.05 : 1 }}
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        transition={{ duration: 0.18 }}
      >
        <span className="absolute inset-0 rounded-full bg-blue-400/30 motion-safe:animate-pulse" />
        <span aria-hidden="true" className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
        {unreadCount > 0 && (
          <span className="absolute -left-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white">
            {unreadCount}
          </span>
        )}
        <AnimatePresence mode="popLayout">
          {(chatState === 'closed' || chatState === 'closing') && (
            <motion.div
              key="launcher-robot"
              className="travel-ai-launcher-robot-wrap relative"
              variants={robotVariants}
              initial={chatState === 'closing' && !reducedMotion ? { opacity: 0, x: -8, y: -4, rotate: -3, scale: 0.94 } : false}
              animate={chatState === 'closing' ? 'return' : launcherPortalActive ? 'activate' : 'idle'}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -10, y: -6, rotate: -3, scale: 0.96 }}
              transition={{ layout: reducedMotion ? { duration: 0 } : { duration: 0.42, ease: smoothEase } }}
            >
              <TravelLauncherRobot mood={robotMood} hasUnread={unreadCount > 0 && chatState === 'closed'} pressed={launcherCompress} portalActive={launcherPortalActive} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      </div>
  );

  return createPortal(panel, document.body);
};
