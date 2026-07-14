import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
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
import { AssistantMessage, TripPlanResponse } from '@/types/ai';
import { useAuth } from '@/context/AuthContext';

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
  kind?: 'TEXT' | 'ITINERARY' | 'LISTING_RECOMMENDATIONS' | 'ERROR';
  itinerary?: TripPlanResponse;
  itineraryCard?: ChatItinerary;
  images?: string[];
};

type ChatTransitionState = 'closed' | 'opening' | 'open' | 'closing';
type RobotMood = 'idle' | 'thinking' | 'success' | 'error';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CHAT_STORAGE_KEY = 'travel-ai-concierge-history-v2';

type ChatItinerary = {
  destination: string;
  title: string;
  summary: string;
  durationDays: number;
  nights?: number;
  travelers?: number;
  bestTime?: string;
  estimatedBudget?: string;
  coverImage?: string;
  mapImage?: string;
  totalEstimatedBudget?: number;
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
  kind: 'TEXT',
  ...extras,
});

const isTripPlanningPrompt = (text: string) => {
  const lower = text.toLowerCase();
  return (
    ['plan a trip', 'itinerary', 'day-by-day', 'day by day', 'travel plan', 'trip to', 'travel to', 'build itinerary', 'getaway', 'vacation', 'holiday'].some((phrase) =>
      lower.includes(phrase)
    ) || /\b\d+\s*[- ]?(?:day|days|night|nights)\b/.test(lower)
  );
};

const extractDestination = (text: string) => {
  const patterns = [
    /\b(?:to|in|for)\s+([A-Z][A-Za-z\s]+?)(?:\s+for|\s+with|\s+in|\s+on|\.|,|$)/,
    /\b([A-Z][A-Za-z\s]+)\s+getaway\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return 'Da Nang';
};

const extractDuration = (text: string) => {
  const match = text.match(/(\d+)\s*(?:day|days|night|nights)/i);
  return match?.[1] ? Math.max(1, Number(match[1])) : 3;
};

const getListingImage = (recommendation: any) => {
  const listing = recommendation?.listing;
  return listing?.coverImageUrl || listing?.images?.find((image: any) => image?.isPrimary)?.imageUrl || listing?.images?.[0]?.imageUrl;
};

const formatBudget = (value?: number) => {
  if (!value) return undefined;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const bucketActivityByTime = (time = ''): 'morning' | 'afternoon' | 'evening' => {
  const lower = time.toLowerCase();
  if (lower.includes('evening') || lower.includes('night') || lower.includes('dinner') || /^1[7-9]|^2[0-3]/.test(lower)) return 'evening';
  if (lower.includes('afternoon') || lower.includes('lunch') || /^1[2-6]/.test(lower)) return 'afternoon';
  return 'morning';
};

const looksLikeItineraryText = (text: string) => /\bday\s*1\b/i.test(text) && /\bday\s*2\b/i.test(text);

const parseTextItinerary = (text: string, originalPrompt: string): ChatItinerary | null => {
  if (!looksLikeItineraryText(text)) return null;
  const destination = extractDestination(originalPrompt);
  const durationDays = extractDuration(originalPrompt) || (text.match(/\bday\s*\d+\b/gi)?.length ?? 3);
  const budgetMatch = text.match(/(?:estimated\s*)?budget[:\s-]*([^\n]+)/i);
  const dayMatches = Array.from(text.matchAll(/(?:^|\n)\s*(?:\*\*)?Day\s*(\d+)(?:\s*[-:—]\s*)?([^\n*]*)/gi));

  const days = dayMatches.slice(0, Math.max(durationDays, 1)).map((match, index) => {
    const start = match.index ?? 0;
    const end = dayMatches[index + 1]?.index ?? text.length;
    const body = text
      .slice(start + match[0].length, end)
      .replace(/^[\s:*.-]+/gm, '')
      .trim();
    const sentences = body.split(/\n|\. /).map((part) => part.replace(/[*-]/g, '').trim()).filter(Boolean);

    return {
      day: Number(match[1]) || index + 1,
      title: match[2]?.trim() || `Day ${index + 1}`,
      shortTitle: (match[2]?.trim() || `Day ${index + 1}`).split(/\s+/).slice(0, 3).join(' '),
      description: sentences.slice(0, 2).join('. ') || 'Curated places, timing, and local travel ideas.',
      morning: sentences[0],
      afternoon: sentences[1],
      evening: sentences[2],
    };
  });

  if (days.length === 0) return null;

  return {
    destination,
    title: `${destination} Getaway`,
    summary: text.split(/\n/).find((line) => line.trim() && !/^day\s*\d+/i.test(line.trim()))?.replace(/[*#]/g, '').trim() || `A personalized trip plan for ${destination}.`,
    durationDays,
    nights: Math.max(durationDays - 1, 0),
    estimatedBudget: budgetMatch?.[1]?.trim(),
    days,
  };
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

const hydrateMessages = (fallbackName?: string): TravelChatMessage[] => {
  if (typeof window === 'undefined') {
    return [createMessage('assistant', `Hi ${fallbackName || 'there'}! I'm your AI travel concierge. How can I help plan your next adventure?`)];
  }

  try {
    const stored = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) throw new Error('No stored chat history');
    const parsed = JSON.parse(stored) as TravelChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid chat history');
    return parsed.map((message, index) => {
      const previousUserPrompt =
        parsed
          .slice(0, index)
          .reverse()
          .find((item) => item.role === 'user')?.content || '';
      const parsedItinerary =
        message.role === 'assistant' && message.kind !== 'ITINERARY' ? parseTextItinerary(message.content, previousUserPrompt) : null;

      return {
        ...message,
        kind: parsedItinerary ? 'ITINERARY' : message.kind,
        itineraryCard: message.itineraryCard || parsedItinerary || (message.itinerary ? normalizeTripPlanForChat(message.itinerary, message.images) : undefined),
        createdAt: new Date(message.createdAt),
        attachments: message.attachments?.map((attachment) => ({
          ...attachment,
          previewUrl: attachment.uploadedUrl || attachment.previewUrl,
        })),
      };
    });
  } catch {
    return [createMessage('assistant', `Hi ${fallbackName || 'there'}! I'm your AI travel concierge. How can I help plan your next adventure?`)];
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

const CompactChatItineraryCard = ({ itinerary }: { itinerary: ChatItinerary }) => {
  void ChatItineraryCard;
  const visibleDays = itinerary.days.slice(0, 4);
  const hiddenDayCount = Math.max(itinerary.days.length - visibleDays.length, 0);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[18px] border border-white/20 bg-white/10 shadow-xl shadow-blue-950/20 backdrop-blur">
      <div className="grid min-w-0 grid-cols-1 items-start gap-3 p-3 min-[360px]:grid-cols-[96px_minmax(0,1fr)]">
        <div className="aspect-[16/9] h-auto w-full max-w-full min-w-0 overflow-hidden rounded-[14px] bg-blue-600/50 min-[360px]:aspect-square min-[360px]:max-w-[96px]">
          {itinerary.coverImage ? (
            <img src={itinerary.coverImage} alt={`${itinerary.destination} destination`} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <TravelFallbackImage destination={itinerary.destination} />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h4 className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight text-white sm:text-[16px]">{itinerary.title || `${itinerary.destination} Getaway`}</h4>
            <span className="shrink-0 rounded-full bg-white/12 px-2 py-1 text-xs font-bold text-blue-100">
              {itinerary.durationDays}D{itinerary.nights !== undefined ? ` / ${itinerary.nights}N` : ''}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-blue-100/90">
            {itinerary.estimatedBudget || itinerary.totalEstimatedBudget ? (
              <span className="rounded-full bg-white/10 px-2 py-1">{itinerary.estimatedBudget || formatBudget(itinerary.totalEstimatedBudget)}</span>
            ) : null}
            {itinerary.travelers ? <span className="rounded-full bg-white/10 px-2 py-1">{itinerary.travelers} travelers</span> : null}
            {itinerary.bestTime ? <span className="rounded-full bg-white/10 px-2 py-1">{itinerary.bestTime}</span> : null}
          </div>
          <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-blue-50/85 sm:text-[13px]">{itinerary.summary}</p>
        </div>
      </div>

      <div className="flex w-full min-w-0 gap-2 overflow-x-auto px-3 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleDays.map((day, index) => (
          <div key={`${day.day}-${day.title}`} className="w-[112px] min-w-[112px] max-w-[112px] shrink-0 snap-start overflow-hidden rounded-[14px] border border-white/15 bg-white/8 p-2.5">
            <div className="mb-2 h-12 overflow-hidden rounded-[10px] bg-white/10">
              {day.image ? (
                <img src={day.image} alt={`${itinerary.destination} day ${day.day}`} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-blue-100">
                  <Map className="h-4 w-4" />
                </div>
              )}
            </div>
            <p className="text-[10px] font-black text-blue-100">Day {day.day}</p>
            <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold leading-4 text-white">{day.shortTitle || day.title}</p>
            <p className="mt-1 line-clamp-2 text-[9px] leading-3 text-blue-100/75">{day.morning || day.afternoon || day.description}</p>
            {hiddenDayCount > 0 && index === visibleDays.length - 1 ? (
              <p className="mt-1 text-[10px] font-bold text-cyan-200">+{hiddenDayCount} days</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mx-3 mb-3 min-w-0 overflow-hidden rounded-[14px]">
        <div className="aspect-[16/7] w-full">
          <MapMiniPreview destination={itinerary.destination} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/15 px-3 py-3">
        <button type="button" className="min-w-0 truncate text-[11px] font-bold text-cyan-200 transition hover:text-white">
          View full itinerary
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" aria-label="Helpful itinerary" className="flex h-7 w-7 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10">
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" aria-label="Not helpful itinerary" className="flex h-7 w-7 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10">
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
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

const TravelMessage = ({ message }: { message: TravelChatMessage }) => {
  const isUser = message.role === 'user';
  if (!isUser && message.kind === 'ITINERARY' && (message.itineraryCard || message.itinerary)) {
    const itinerary = message.itineraryCard || normalizeTripPlanForChat(message.itinerary as TripPlanResponse, message.images);
    return (
      <div className="motion-fade-up flex w-full min-w-0 justify-start">
        <div className="w-full min-w-0 max-w-full">
          <CompactChatItineraryCard itinerary={itinerary} />
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
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [pendingResponseKind, setPendingResponseKind] = useState<'TEXT' | 'ITINERARY' | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>(suggestionChips);
  const [messages, setMessages] = useState<TravelChatMessage[]>(() => hydrateMessages(user?.fullName?.split(' ')[0]));

  const history = useMemo<AssistantMessage[]>(() => messages.map(({ role, content }) => ({ role, content })), [messages]);
  const reducedMotion = useReducedMotion();
  const isVisible = chatState !== 'closed';
  const robotMood = useRobotMood({
    isSending: isLoading,
    error: requestError,
    lastCompletedMessageId,
  });
  const canSend = input.trim().length > 0 || attachments.length > 0;

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, isVisible]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const serializable = messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map((attachment) => ({
        id: attachment.id,
        uploadedUrl: attachment.uploadedUrl,
        previewUrl: attachment.uploadedUrl || attachment.previewUrl,
      })),
    }));
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(serializable));
  }, [messages]);

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
    const trimmedText = text.trim();
    const wantsItinerary = isTripPlanningPrompt(trimmedText);
    setIsLoading(true);
    setRequestError(false);
    setPendingResponseKind(wantsItinerary ? 'ITINERARY' : 'TEXT');
    setUploadError('');

    try {
      const uploaded = await uploadAttachments();
      const uploadedUrls = uploaded.map((attachment) => attachment.uploadedUrl).filter(Boolean);
      const messageContent = [trimmedText || 'Please review these travel images.', uploadedUrls.length ? `Attached image URLs:\n${uploadedUrls.join('\n')}` : '']
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

      let aiMessage: TravelChatMessage;
      if (wantsItinerary) {
        const destination = extractDestination(trimmedText);
        const durationDays = extractDuration(trimmedText);
        const travelers = trimmedText.match(/(\d+)\s*(?:people|travelers|adults|guests)/i)?.[1]
          ? Number(trimmedText.match(/(\d+)\s*(?:people|travelers|adults|guests)/i)?.[1])
          : undefined;
        const [tripPlan, recommendations] = await Promise.all([
          aiService.planTrip({
            naturalLanguageQuery: trimmedText,
            destination,
            durationDays,
            groupSize: travelers,
          }),
          aiService
            .getRecommendations({
              destination,
              interests: ['HOTEL', 'EXPERIENCE'],
              categories: ['HOTEL', 'TOUR', 'EXPERIENCE'],
              size: 4 } as any)
            .catch(() => null),
        ]);
        const images = recommendations?.recommendations?.map(getListingImage).filter(Boolean) || [];
        const itineraryCard = normalizeTripPlanForChat(tripPlan, images, travelers);
        aiMessage = createMessage('assistant', tripPlan.aiSummary || `Here is a structured itinerary for ${tripPlan.destination}.`, undefined, {
          kind: 'ITINERARY',
          itinerary: tripPlan,
          itineraryCard,
          images,
        });
      } else {
        const response = await aiService.chatWithAssistant({
          message: messageContent,
          history,
        });
        const textItinerary = parseTextItinerary(response.reply || '', trimmedText);
        if (textItinerary) {
          const recommendationImages = await aiService
            .getRecommendations({
              destination: textItinerary.destination,
              interests: ['HOTEL', 'EXPERIENCE'],
              categories: ['HOTEL', 'TOUR', 'EXPERIENCE'],
            })
            .then((result) => result.recommendations?.map(getListingImage).filter(Boolean) || [])
            .catch(() => []);
          const daysWithImages = textItinerary.days.map((day, index) => ({
            ...day,
            image: day.image || recommendationImages[index + 1] || recommendationImages[index],
          }));
          aiMessage = createMessage('assistant', response.reply || `Here is a structured itinerary for ${textItinerary.destination}.`, undefined, {
            kind: 'ITINERARY',
            itineraryCard: {
              ...textItinerary,
              coverImage: textItinerary.coverImage || recommendationImages[0],
              days: daysWithImages,
            },
            images: recommendationImages,
          });
        } else {
          aiMessage = createMessage('assistant', response.reply || 'I found a few travel ideas for you.');
        }
        setSuggestedActions(response.suggestedActions?.length ? response.suggestedActions : suggestionChips);
      }
      setMessages([...nextMessages, aiMessage]);
      setLastCompletedMessageId(aiMessage.id);
      if (aiMessage.kind === 'ITINERARY') {
        setSuggestedActions(['Adjust this for a lower budget', 'Add more food stops', 'Make it family-friendly']);
      }
      if (!isVisible) setUnreadCount((count) => count + 1);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      setRequestError(true);
      setUploadError(error instanceof Error ? error.message : 'The AI concierge could not respond right now.');
      setMessages((current) => [...current, createMessage('assistant', 'Sorry, I could not connect to the travel concierge right now. Please try again.')]);
    } finally {
      setIsLoading(false);
      setPendingResponseKind(null);
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
              {messages.slice(1).map((message) => (
                <TravelMessage key={message.id} message={message} />
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
                    Thinking...
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
        className={`travel-ai-launcher pointer-events-auto fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[1001] flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-2xl shadow-blue-950/40 ring-4 ring-blue-400/20 sm:bottom-5 sm:right-5 ${launcherPortalActive ? 'travel-ai-launcher--portal' : ''} ${launcherCompress ? 'travel-ai-launcher--compress' : ''}`}
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
