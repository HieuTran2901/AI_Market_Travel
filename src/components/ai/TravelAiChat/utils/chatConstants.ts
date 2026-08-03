import {
  CalendarDays,
  Hotel,
  Image,
  Map,
  Paintbrush,
  Plane,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export const MAX_IMAGES = 4;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const CHAT_STORAGE_KEY = 'travel-ai-concierge-history-v2';

export const getChatStorageKey = (ownerId?: string | number | null) =>
  ownerId ? `${CHAT_STORAGE_KEY}:user:${ownerId}` : `${CHAT_STORAGE_KEY}:guest`;

export const travelQuickActions = [
  { title: 'Plan a trip', helper: 'Personalized itineraries', icon: Plane, tone: 'from-cyan-400/20 to-blue-500/10 text-cyan-200' },
  { title: 'Find hotels', helper: 'Best stays for you', icon: Hotel, tone: 'from-blue-400/20 to-indigo-500/10 text-blue-200' },
  { title: 'Build itinerary', helper: 'Day-by-day plans', icon: CalendarDays, tone: 'from-violet-400/20 to-purple-500/10 text-violet-200' },
  { title: 'Ask about visa', helper: 'Visa & entry guidance', icon: ShieldCheck, tone: 'from-fuchsia-400/20 to-violet-500/10 text-fuchsia-200' },
];

export const workQuickActions = [
  { title: 'Improve Listing', helper: 'Boost attractiveness', icon: Sparkles, tone: 'from-purple-400/20 to-indigo-500/10 text-purple-200' },
  { title: 'Generate Content', helper: 'AI descriptions', icon: Paintbrush, tone: 'from-blue-400/20 to-cyan-500/10 text-blue-200' },
  { title: 'SEO Optimize', helper: 'Rank higher', icon: Map, tone: 'from-emerald-400/20 to-teal-500/10 text-emerald-200' },
  { title: 'Market Analysis', helper: 'Pricing & trends', icon: Zap, tone: 'from-amber-400/20 to-orange-500/10 text-amber-200' },
  { title: 'Photo Feedback', helper: 'Image quality check', icon: Image, tone: 'from-rose-400/20 to-pink-500/10 text-rose-200' },
  { title: 'Safety Check', helper: 'Policy compliance', icon: ShieldCheck, tone: 'from-sky-400/20 to-blue-500/10 text-sky-200' },
];

export const travelSuggestionChips = ['Best beaches in Da Nang', 'Top seafood spots', 'Hoi An day trip'];
export const workSuggestionChips = ['Improve my description', 'Add more amenities', 'Check SEO score'];
