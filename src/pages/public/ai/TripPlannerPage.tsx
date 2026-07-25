import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  Compass,
  DollarSign,
  Loader2,
  Map,
  MapPin,
  Plane,
  Plus,
  RefreshCw,
  Route,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { aiService } from '../../../services/aiService';
import { RankedRecommendation, RecommendationResponse, TripPlanResponse } from '../../../types/ai';
import { getListingDetailPath } from '../../../utils/listingRoutes';

const travelStyles = ['Relaxation', 'Culture', 'Adventure', 'Luxury', 'Budget'];
const interestOptions = ['Beaches', 'Food', 'History', 'Nature', 'Nightlife'];
const plannerBenefits = ['Personalized for you', 'Smart & Fast', 'Save & Edit anytime'];
const budgetOptions = [
  { label: 'Select budget', value: '' },
  { label: '$300 per person', value: '300' },
  { label: '$600 per person', value: '600' },
  { label: '$1,000 per person', value: '1000' },
  { label: '$1,500+ per person', value: '1500' },
];

const themeTones = [
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
];

const getListingImage = (recommendation?: RankedRecommendation) => {
  const listing = recommendation?.listing;
  return listing?.coverImageUrl || listing?.images?.find((image: any) => image?.isPrimary)?.imageUrl || listing?.images?.[0]?.imageUrl;
};

const getDayImage = (day: TripPlanResponse['itinerary'][number]) => {
  return day.coverImageUrl || day.activities.find((activity) => activity.imageUrl)?.imageUrl;
};

const formatCurrency = (value?: number, currency = 'USD') => {
  if (value === undefined || value === null || Number.isNaN(value)) return 'Flexible';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const getTripDuration = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 3;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Number.isFinite(diff) && diff > 0 ? diff : 3;
};

const isValidTripPlan = (value: unknown): value is TripPlanResponse => {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<TripPlanResponse>;
  if (!Array.isArray(plan.itinerary) || plan.itinerary.length === 0) return false;
  if (typeof plan.destination !== 'string') return false;
  if (typeof plan.durationDays !== 'number' || !Number.isFinite(plan.durationDays)) return false;
  if (typeof plan.aiSummary !== 'string') return false;
  if (typeof plan.totalEstimatedBudget !== 'number' || !Number.isFinite(plan.totalEstimatedBudget)) return false;

  return plan.itinerary.every((day) => (
    day &&
    typeof day.dayNumber === 'number' &&
    Number.isFinite(day.dayNumber) &&
    typeof day.theme === 'string' &&
    Array.isArray(day.activities) &&
    day.activities.every((activity) => (
      activity &&
      typeof activity.time === 'string' &&
      typeof activity.listingName === 'string' &&
      typeof activity.type === 'string' &&
      typeof activity.description === 'string' &&
      (activity.estimatedCost === undefined || typeof activity.estimatedCost === 'number')
    ))
  ));
};

const PlannerIllustration = () => (
  <svg aria-hidden="true" className="h-full w-full object-contain" viewBox="0 0 600 330" fill="none">
    <path d="M84 295C107 247 152 222 214 235C260 244 289 262 346 230C394 203 452 196 528 237V330H84V295Z" fill="white" opacity="0.13" />
    <path d="M416 78C457 63 506 84 530 121C553 157 550 205 518 234C482 267 417 262 379 227C342 193 344 142 369 111C381 96 394 86 416 78Z" fill="white" opacity="0.11" />
    <path d="M135 260C181 217 235 205 299 226C354 244 392 231 448 199" stroke="#BFDBFE" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 12" opacity="0.42" />
    <path d="M116 247H319C331 247 341 257 341 269V298H94V269C94 257 104 247 116 247Z" fill="#5B7CFA" />
    <path d="M112 247H321V269H112V247Z" fill="#7895FF" opacity="0.48" />
    <rect x="207" y="139" width="120" height="119" rx="43" fill="url(#robotBody)" />
    <rect x="224" y="172" width="86" height="48" rx="24" fill="#0F172A" />
    <circle cx="248" cy="196" r="8" fill="#67E8F9" />
    <circle cx="287" cy="196" r="8" fill="#67E8F9" />
    <rect x="255" y="118" width="25" height="23" rx="8" fill="#E0E7FF" />
    <path d="M268 118V94M251 93H286" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
    <rect x="310" y="62" width="220" height="150" rx="18" fill="white" opacity="0.96" />
    <rect x="310" y="62" width="220" height="34" rx="18" fill="#DBEAFE" />
    <circle cx="329" cy="80" r="4" fill="#22C55E" />
    <circle cx="344" cy="80" r="4" fill="#F59E0B" />
    <circle cx="359" cy="80" r="4" fill="#EF4444" />
    <rect x="333" y="111" width="76" height="13" rx="6.5" fill="#1E293B" opacity="0.88" />
    {[0, 1, 2].map((row) => (
      <g key={row} transform={`translate(333 ${140 + row * 31})`}>
        <circle cx="8" cy="8" r="8" fill="#2563EB" opacity="0.13" />
        <path d="M8 3V13M3 8H13" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
        <rect x="26" y="0" width="64" height="9" rx="4.5" fill="#64748B" opacity="0.28" />
        <rect x="26" y="14" width="104" height="8" rx="4" fill="#2563EB" opacity={row === 0 ? '0.25' : '0.15'} />
        <rect x="145" y="0" width="47" height="23" rx="7" fill={row === 0 ? '#BFDBFE' : row === 1 ? '#DDD6FE' : '#CFFAFE'} />
      </g>
    ))}
    <rect x="470" y="154" width="72" height="121" rx="18" fill="url(#suitcase)" />
    <path d="M489 153V129C489 119 497 111 507 111C517 111 525 119 525 129V153" stroke="#8B5CF6" strokeWidth="10" strokeLinecap="round" opacity="0.86" />
    <path d="M491 178V246M506 173V251M521 178V246" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" opacity="0.38" />
    <circle cx="489" cy="281" r="7" fill="#4F46E5" />
    <circle cx="526" cy="281" r="7" fill="#4F46E5" />
    <path d="M535 117C547 93 557 73 582 63C580 92 565 112 535 117Z" fill="#C4B5FD" opacity="0.45" />
    <path d="M546 156C566 142 580 132 599 134C590 156 573 164 546 156Z" fill="#C4B5FD" opacity="0.36" />
    <path d="M154 118C185 106 215 105 246 119" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 10" opacity="0.36" />
    <path d="M152 105L107 90L151 76L143 95L152 105Z" fill="white" opacity="0.58" />
    <path d="M70 88L76 101L90 106L76 111L70 124L64 111L50 106L64 101L70 88Z" fill="white" opacity="0.28" />
    <path d="M395 35L401 47L414 52L401 57L395 69L389 57L376 52L389 47L395 35Z" fill="white" opacity="0.24" />
    <defs>
      <linearGradient id="robotBody" x1="207" y1="139" x2="327" y2="258" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EEF2FF" />
        <stop offset="1" stopColor="#A5B4FC" />
      </linearGradient>
      <linearGradient id="suitcase" x1="470" y1="154" x2="542" y2="275" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A78BFA" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
    </defs>
  </svg>
);

const HeroBackgroundDecorations = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
    <div className="absolute bottom-0 right-1/4 h-44 w-44 rounded-full bg-blue-200/10 blur-3xl" />
    <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 320" fill="none">
      <path d="M599 98C664 59 736 61 808 105" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 12" opacity="0.18" />
      <path d="M908 71L939 54L923 87L918 75L908 71Z" fill="white" opacity="0.28" />
      <path d="M166 230C255 186 350 184 464 221" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.08" />
      <circle cx="598" cy="71" r="3" fill="white" opacity="0.22" />
      <circle cx="758" cy="45" r="3" fill="white" opacity="0.22" />
      <circle cx="1110" cy="88" r="3" fill="white" opacity="0.24" />
      <path d="M1064 51L1069 62L1080 67L1069 72L1064 83L1059 72L1048 67L1059 62L1064 51Z" fill="white" opacity="0.2" />
    </svg>
  </div>
);

const RoutePreview = ({ destination, itinerary }: { destination: string; itinerary: TripPlanResponse['itinerary'] }) => {
  const points = itinerary.flatMap((day) =>
    day.activities
      .filter((activity) => typeof activity.latitude === 'number' && typeof activity.longitude === 'number')
      .map((activity) => ({ dayNumber: day.dayNumber, label: activity.listingName, activity }))
  ).slice(0, 5);

  if (!points.length) {
    return (
      <div className="mt-4 rounded-[20px] border border-dashed border-blue-100 bg-blue-50/60 p-5 text-sm font-semibold text-slate-600">
        Route preview for {destination || 'your destination'} will appear when itinerary activities include marketplace coordinates.
      </div>
    );
  }

  return (
    <div className="relative mt-4 min-h-[180px] w-full overflow-hidden rounded-[20px] border border-blue-100 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-5">
      <div className="relative z-10 text-sm font-bold text-slate-950">Route preview for {destination || 'your destination'}</div>
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 640 210" fill="none" preserveAspectRatio="none">
        <path d="M548 48C580 40 602 29 626 13" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" opacity="0.45" />
        <path d="M622 12L602 40L597 26L622 12Z" fill="#93C5FD" opacity="0.45" />
        <path d="M96 112C190 78 257 141 338 102C418 64 474 112 558 83" stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 10" opacity="0.68" />
        <circle cx="112" cy="108" r="13" fill="#0EA5E9" stroke="white" strokeWidth="6" />
        <circle cx="336" cy="101" r="13" fill="#14B8A6" stroke="white" strokeWidth="6" />
        <circle cx="556" cy="84" r="13" fill="#D946EF" stroke="white" strokeWidth="6" />
      </svg>
      <div className="relative z-10 mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {points.map((point) => (
          <div key={`${point.dayNumber}-${point.activity.listingId ?? point.label}`} className="min-w-0 text-center">
            <p className="truncate text-sm font-bold text-slate-700">{point.label}</p>
            <p className="mt-1 text-xs font-semibold text-blue-700">Day {point.dayNumber}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResultTravelIllustration = () => (
  <svg aria-hidden="true" className="h-[230px] w-full max-w-[420px]" viewBox="0 0 420 300" fill="none">
    <path d="M91 230C114 178 164 153 224 169C277 184 305 216 362 196V300H91V230Z" fill="#DBEAFE" opacity="0.55" />
    <path d="M123 217C152 193 194 188 230 207C266 226 305 224 336 200" stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    <rect x="164" y="107" width="93" height="139" rx="20" fill="url(#emptySuitcase)" />
    <path d="M185 107V86C185 74 195 64 207 64H215C227 64 237 74 237 86V107" stroke="#8B5CF6" strokeWidth="10" strokeLinecap="round" opacity="0.62" />
    <path d="M184 135V220M210 129V227M237 135V220" stroke="#6366F1" strokeWidth="5" strokeLinecap="round" opacity="0.32" />
    <circle cx="182" cy="253" r="8" fill="#475569" />
    <circle cx="239" cy="253" r="8" fill="#475569" />
    <path d="M134 227H84C74 227 66 219 66 209V179C66 169 74 161 84 161H134C144 161 152 169 152 179V209C152 219 144 227 134 227Z" fill="white" stroke="#CBD5E1" strokeWidth="3" />
    <circle cx="109" cy="195" r="18" fill="#475569" />
    <circle cx="109" cy="195" r="9" fill="#E0F2FE" />
    <rect x="77" y="153" width="63" height="15" rx="7.5" fill="#64748B" />
    <rect x="269" y="180" width="34" height="62" rx="6" fill="#FBBF24" />
    <rect x="290" y="167" width="28" height="76" rx="7" fill="#F59E0B" />
    <path d="M326 125C348 102 367 91 392 91C380 118 358 132 326 125Z" fill="#BFDBFE" opacity="0.72" />
    <path d="M86 127C63 111 55 90 65 66C86 85 94 106 86 127Z" fill="#DBEAFE" opacity="0.78" />
    <path d="M238 99C278 88 317 94 353 117" stroke="#93C5FD" strokeWidth="3" strokeDasharray="7 9" strokeLinecap="round" opacity="0.58" />
    <path d="M348 101L385 81L366 122L360 108L348 101Z" fill="#2563EB" opacity="0.62" />
    <path d="M98 53L103 64L115 68L103 72L98 83L93 72L81 68L93 64L98 53Z" fill="#8B5CF6" opacity="0.28" />
    <path d="M287 44L292 54L303 58L292 62L287 72L282 62L271 58L282 54L287 44Z" fill="#2563EB" opacity="0.24" />
    <defs>
      <linearGradient id="emptySuitcase" x1="164" y1="107" x2="257" y2="246" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BFDBFE" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
    </defs>
  </svg>
);

const EmptyPlannerState = () => (
  <div className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 px-5 py-6 shadow-sm sm:px-8 sm:py-7">
    <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-10 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl" />
    <div className="relative z-10 grid min-w-0 grid-cols-1 items-center gap-6 md:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)] md:gap-8">
      <div className="motion-fade-up mx-auto flex w-full max-w-[300px] items-center justify-center md:max-w-none">
        <svg aria-hidden="true" className="h-[130px] w-full max-w-[300px] sm:h-[150px]" viewBox="0 0 360 190" fill="none">
          <path d="M63 139C103 101 143 94 183 115C222 136 255 117 295 78" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 9" opacity="0.7" />
          <path d="M54 56L129 33L196 59L270 37L309 129L238 158L166 132L92 159L54 56Z" fill="#E0E7FF" />
          <path d="M129 33L166 132M196 59L238 158M54 56L92 159M270 37L309 129" stroke="#BFDBFE" strokeWidth="3" />
          <path d="M68 67L126 50L188 73L260 54L290 122L238 143L170 118L103 143L68 67Z" fill="white" opacity="0.82" />
          <path d="M119 61C133 70 147 75 164 76M181 88C201 91 218 89 236 81M96 111C118 100 138 99 158 108M202 124C223 119 240 112 259 100" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <path d="M202 81C202 59 219 42 241 42C263 42 280 59 280 81C280 111 241 139 241 139C241 139 202 111 202 81Z" fill="#2563EB" />
          <circle cx="241" cy="81" r="14" fill="white" />
          <circle cx="241" cy="81" r="7" fill="#93C5FD" />
          <path d="M79 121C69 112 65 99 69 85C51 98 45 122 56 140C67 157 91 160 108 147C96 146 87 139 79 121Z" fill="#DBEAFE" opacity="0.88" />
          <path d="M297 80C310 65 326 58 346 58C333 76 317 85 297 80Z" fill="#C7D2FE" opacity="0.8" />
          <path d="M304 107C317 104 329 107 338 117C322 121 311 119 304 107Z" fill="#BFDBFE" opacity="0.85" />
          <path d="M141 25L146 35L157 39L146 43L141 53L136 43L125 39L136 35L141 25Z" fill="#8B5CF6" opacity="0.35" className="motion-safe:animate-pulse" />
          <path d="M280 22L284 30L292 33L284 36L280 44L276 36L268 33L276 30L280 22Z" fill="#2563EB" opacity="0.28" className="motion-safe:animate-pulse" />
          <path d="M202 145C230 151 256 151 280 143" stroke="#A5B4FC" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
        </svg>
      </div>
      <div className="min-w-0 text-center md:text-left">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">No itinerary generated yet</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          Add a destination and trip description above, then click generate to get started.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
          {[
            { label: 'AI-powered suggestions', icon: Sparkles, tone: 'text-violet-600 bg-violet-50 border-violet-100' },
            { label: 'Optimized route & time', icon: Route, tone: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'Save & customize easily', icon: Map, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          ].map(({ label, icon: Icon, tone }) => (
            <span key={label} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:text-sm">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${tone}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const LoadingPlannerState = () => (
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3 text-blue-700">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-semibold">Crafting your itinerary from marketplace context...</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
    <div className="space-y-4">
      <div className="h-36 animate-pulse rounded-[24px] bg-slate-100" />
      <div className="h-48 animate-pulse rounded-[24px] bg-slate-100" />
    </div>
  </div>
);

export const TripPlannerPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetPerPerson, setBudgetPerPerson] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [travelStyle, setTravelStyle] = useState('Relaxation');
  const [interests, setInterests] = useState<string[]>(['Beaches']);
  const [customInterest, setCustomInterest] = useState('');
  const [activeRecommendationTab, setActiveRecommendationTab] = useState<'stays' | 'activities'>('stays');
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<TripPlanResponse | null>(null);
  const [stayRecommendations, setStayRecommendations] = useState<RecommendationResponse | null>(null);
  const [activityRecommendations, setActivityRecommendations] = useState<RecommendationResponse | null>(null);

  const durationDays = useMemo(() => getTripDuration(startDate, endDate), [startDate, endDate]);
  const budgetValue = budgetPerPerson ? Number(budgetPerPerson) : undefined;
  const selectedInterests = useMemo(() => [...interests, ...(customInterest.trim() ? [customInterest.trim()] : [])], [interests, customInterest]);
  const allRecommendations = [...(stayRecommendations?.recommendations ?? []), ...(activityRecommendations?.recommendations ?? [])];

  const handleInterestToggle = (interest: string) => {
    setInterests((current) => (current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]));
  };

  const handleReset = () => {
    setQuery('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setBudgetPerPerson('');
    setTravelers(2);
    setTravelStyle('Relaxation');
    setInterests(['Beaches']);
    setCustomInterest('');
    setPlan(null);
    setStayRecommendations(null);
    setActivityRecommendations(null);
    setError('');
    setActiveDayIndex(0);
  };

  const handleSurprise = () => {
    setDestination('Da Nang, Vietnam');
    setQuery('Create a balanced coastal itinerary with beaches, local food, cultural highlights, and a comfortable pace.');
    setBudgetPerPerson('600');
    setTravelers(2);
    setTravelStyle('Culture');
    setInterests(['Beaches', 'Food', 'History']);
  };

  const generatePlan = async () => {
    if (!destination.trim() || !query.trim()) {
      setError('Please add a destination and trip description before generating.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const focusCategories = selectedInterests.length ? selectedInterests : [travelStyle];
      const tripResult = await aiService.planTrip({
          naturalLanguageQuery: `${query.trim()} Travel style: ${travelStyle}. Interests: ${focusCategories.join(', ')}.`,
          destination: destination.trim(),
          durationDays,
          totalBudget: budgetValue ? budgetValue * travelers : undefined,
          groupSize: travelers,
          startDate: startDate || undefined,
          focusCategories,
        });

      if (!isValidTripPlan(tripResult)) {
        if (import.meta.env.DEV) {
          console.warn('Trip planner returned an invalid response shape.');
        }
        throw new Error('Invalid trip plan response');
      }

      const selectedListingIds = Array.from(new Set(
        tripResult.itinerary.flatMap((day) => day.activities.map((activity) => activity.listingId).filter((id): id is number => typeof id === 'number'))
      ));
      const planRecommendations = tripResult.marketplaceRecommendations ?? [];
      const fallbackStayRecommendations: RecommendationResponse = {
        recommendations: planRecommendations
          .filter((listing: any) => listing?.category === 'HOTEL')
          .map((listing: any, index: number) => ({
            rank: index + 1,
            score: Math.max(70, Math.round(Number(listing.averageRating ?? 4) * 20)),
            reasoning: 'Relevant marketplace stay for this itinerary.',
            listing,
          })),
        aiSummary: 'Marketplace stays from the current destination.',
        destination: tripResult.destination,
        mockedAi: true,
      };
      const fallbackActivityRecommendations: RecommendationResponse = {
        recommendations: planRecommendations
          .filter((listing: any) => listing?.category !== 'HOTEL')
          .map((listing: any, index: number) => ({
            rank: index + 1,
            score: Math.max(70, Math.round(Number(listing.averageRating ?? 4) * 20)),
            reasoning: 'Relevant marketplace option for this itinerary.',
            listing,
          })),
        aiSummary: 'Marketplace activities from the current destination.',
        destination: tripResult.destination,
        mockedAi: true,
      };
      const [staysResult, activitiesResult] = await Promise.all([
        aiService.getRecommendations({
          destination: destination.trim(),
          budgetPerPerson: budgetValue,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          groupSize: travelers,
          interests: focusCategories,
          categories: ['HOTEL'],
          selectedListingIds,
        }).catch(() => fallbackStayRecommendations),
        aiService.getRecommendations({
          destination: destination.trim(),
          budgetPerPerson: budgetValue,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          groupSize: travelers,
          interests: focusCategories,
          categories: ['TOUR', 'EXPERIENCE', 'RESTAURANT'],
          selectedListingIds,
        }).catch(() => fallbackActivityRecommendations),
      ]);

      setPlan(tripResult);
      setStayRecommendations(staysResult && staysResult.recommendations.length ? staysResult : fallbackStayRecommendations);
      setActivityRecommendations(activitiesResult && activitiesResult.recommendations.length ? activitiesResult : fallbackActivityRecommendations);
      setActiveDayIndex(0);
    } catch (err: any) {
      const errorCode = err?.errorCode || err?.code;
      const requestId = err?.requestId;
      if (import.meta.env.DEV) {
        console.warn('Failed to plan trip:', { errorCode, requestId });
      }
      setError(
        errorCode === 'AI_OUTPUT_TRUNCATED'
          ? 'The itinerary response was incomplete. Please generate it again.'
          : 'We couldn’t generate a valid itinerary this time. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    await generatePlan();
  };

  const currentRecommendations = activeRecommendationTab === 'stays' ? stayRecommendations?.recommendations ?? [] : activityRecommendations?.recommendations ?? [];
  const activityCount = plan?.itinerary.reduce((total, day) => total + day.activities.length, 0) ?? 0;
  const pace = activityCount > (plan?.durationDays ?? 3) * 4 ? 'Packed' : activityCount > (plan?.durationDays ?? 3) * 2 ? 'Moderate' : 'Relaxed';

  return (
    <main className="min-h-screen bg-slate-50/70 pb-12">
      <div className="mx-auto w-full max-w-[1536px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="detail-enter relative min-h-[280px] max-h-none overflow-hidden rounded-t-[24px] bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-500 text-white shadow-2xl shadow-blue-950/20 sm:max-h-[320px]">
          <HeroBackgroundDecorations />
          <div className="relative z-10 grid min-h-[280px] min-w-0 grid-cols-1 items-center gap-5 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)] lg:gap-8 lg:px-10 lg:py-8">
            <div className="min-w-0">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-50 shadow-sm shadow-blue-950/10 backdrop-blur">
                <Bot className="h-5 w-5" />
                AI Planner
              </div>
              <h1 className="max-w-2xl text-[34px] font-black leading-[1.06] tracking-tight sm:text-[40px] lg:text-[42px]">Build a trip itinerary</h1>
              <p className="mt-3 max-w-xl text-[15px] font-medium leading-7 text-blue-50 sm:text-base">
                Our AI planner creates a personalized day-by-day itinerary based on your destination, preferences, and travel style.
              </p>
              <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
                {plannerBenefits.map((benefit, index) => (
                  <span
                    key={benefit}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/16 bg-white/12 px-3.5 py-2 text-[13px] font-bold text-white shadow-sm backdrop-blur transition duration-200 hover:bg-white/18"
                  >
                    {index === 0 ? <Sparkles className="h-4 w-4" /> : index === 1 ? <Plane className="h-4 w-4" /> : <Route className="h-4 w-4" />}
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative hidden h-[260px] min-w-0 overflow-visible lg:block">
              <PlannerIllustration />
            </div>
          </div>
        </section>

        <section className="detail-enter detail-enter-delay-1 relative z-10 -mt-5 rounded-[26px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-6">
          <form onSubmit={handlePlanTrip} className="space-y-5">
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(260px,1.5fr)_minmax(210px,0.9fr)_minmax(190px,0.8fr)]">
              <label className="min-w-0 text-sm font-semibold text-slate-700">
                Destination
                <span className="relative mt-2 block">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="e.g., Da Nang, Vietnam"
                  />
                </span>
              </label>
              <label className="min-w-0 text-sm font-semibold text-slate-700">
                Trip description
                <span className="relative mt-2 block">
                  <Sparkles className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Describe your ideal trip..."
                  />
                </span>
              </label>
              <div className="min-w-0 text-sm font-semibold text-slate-700">
                Travel dates
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="h-12 min-w-0 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="h-12 min-w-0 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
              <label className="min-w-0 text-sm font-semibold text-slate-700">
                Budget per person
                <span className="relative mt-2 block">
                  <Wallet className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    value={budgetPerPerson}
                    onChange={(event) => setBudgetPerPerson(event.target.value)}
                    className="h-12 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {budgetOptions.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
              <label className="text-sm font-semibold text-slate-700">
                Travelers
                <span className="relative mt-2 block">
                  <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    value={travelers}
                    onChange={(event) => setTravelers(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? 'Traveler' : 'Travelers'}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <div className="min-w-0">
                <p className="mb-2 text-sm font-semibold text-slate-700">Travel style</p>
                <div className="flex flex-wrap gap-2">
                  {travelStyles.map((style) => {
                    const isSelected = style === travelStyle;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setTravelStyle(style)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${
                          isSelected ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-sm font-semibold text-slate-700">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => {
                    const isSelected = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${
                          isSelected ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                  <label className="relative block min-w-[150px]">
                    <Plus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={customInterest}
                      onChange={(event) => setCustomInterest(event.target.value)}
                      className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Add interest"
                    />
                  </label>
                </div>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={handleReset} className="h-11 rounded-xl">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={handleSurprise} className="h-11 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Surprise me
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 rounded-xl bg-blue-600 px-7 text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  {isLoading ? 'Generating...' : 'Generate Trip Plan'}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <section className="mt-5">
          {isLoading ? (
            <LoadingPlannerState />
          ) : plan ? (
            <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.95fr)]">
              <div className="motion-fade-up flex min-w-0 flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-violet-50 text-violet-600">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-black tracking-tight text-slate-950">Your AI Itinerary (Preview)</h2>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {plan.durationDays} days
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {plan.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button type="button" variant="outline" className="h-11 rounded-2xl border-blue-100 px-5 font-bold text-blue-700">
                      View full itinerary <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <button
                      type="button"
                      onClick={() => setActiveDayIndex((index) => Math.max(index - 1, 0))}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDayIndex((index) => Math.min(index + 1, Math.max(plan.itinerary.length - 1, 0)))}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Next day"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mb-5 max-w-3xl text-sm leading-6 text-slate-600">{plan.aiSummary || 'Here is your personalized trip plan tailored to your preferences and travel style.'}</p>

                {plan.itinerary.length ? (
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {plan.itinerary.map((day, index) => {
                      const image = getDayImage(day) || getListingImage(allRecommendations[index % Math.max(allRecommendations.length, 1)]);
                      return (
                        <button
                          key={day.dayNumber}
                          type="button"
                          onClick={() => setActiveDayIndex(index)}
                          className={`group min-w-0 overflow-hidden rounded-[20px] border bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                            activeDayIndex === index ? 'border-blue-300 ring-4 ring-blue-50' : 'border-slate-200'
                          }`}
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          <div className="relative h-36 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                            {image ? (
                              <img src={image} alt={`${day.theme} preview`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-blue-500">
                                <Plane className="h-10 w-10" />
                              </div>
                            )}
                            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">Day {day.dayNumber}</span>
                          </div>
                          <div className="p-4">
                            <h3 className="line-clamp-2 text-base font-bold text-slate-950">{day.theme}</h3>
                            <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">{day.activities[0]?.description || 'A curated day shaped by your trip preferences.'}</p>
                            <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${themeTones[index % themeTones.length]}`}>{day.activities[0]?.type || travelStyle}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-[22px] bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 px-6 py-10 text-center">
                    <ResultTravelIllustration />
                    <h3 className="mt-3 text-xl font-black text-slate-900">Your detailed itinerary will appear here</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                      Once we generate your plan, you will see day-by-day schedule, recommended places, activities, and tips.
                    </p>
                    <Button type="button" onClick={generatePlan} disabled={isLoading} className="mt-5 h-11 rounded-xl bg-blue-600 px-6 font-bold text-white">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate new trip plan
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid min-w-0 gap-5">
                <section className="motion-fade-up min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">Trip Overview</h2>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Updated just now
                      <RefreshCw className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="min-w-0 rounded-[20px] border border-emerald-100 bg-emerald-50/80 p-5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <p className="text-[13px] font-bold text-slate-700">Est. total cost</p>
                      <p className="mt-2 whitespace-nowrap text-3xl font-black text-slate-950">{formatCurrency(plan.totalEstimatedBudget)}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">Calculated for {plan.durationDays} days</p>
                    </div>
                    <div className="min-w-0 rounded-[20px] border border-orange-100 bg-orange-50/70 p-5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                        <Route className="h-6 w-6" />
                      </div>
                      <p className="text-[13px] font-bold text-slate-700">Activities</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{activityCount}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">Included</p>
                    </div>
                    <div className="min-w-0 rounded-[20px] border border-blue-100 bg-blue-50/80 p-5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                        <Compass className="h-6 w-6" />
                      </div>
                      <p className="text-[13px] font-bold text-slate-700">Pace</p>
                      <p className="mt-2 whitespace-nowrap text-3xl font-black text-slate-950">{pace}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">Easy & comfortable</p>
                    </div>
                  </div>
                  <RoutePreview destination={plan.destination} itinerary={plan.itinerary} />
                </section>

                <aside className="motion-fade-up min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">Recommended for you</h2>
                    <span className="text-sm font-semibold text-slate-500">{currentRecommendations.length} found</span>
                  </div>
                  <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                    {(['stays', 'activities'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveRecommendationTab(tab)}
                        className={`rounded-xl px-3 py-3 text-sm font-bold capitalize transition ${
                          activeRecommendationTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {currentRecommendations.length ? (
                      currentRecommendations.slice(0, 4).map((recommendation) => {
                        const listing = recommendation.listing;
                        const image = getListingImage(recommendation);
                        const detailPath = listing ? getListingDetailPath(listing) : null;
                        const cardContent = (
                          <>
                            <div className="h-[72px] w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              {image ? <img src={image} alt={listing?.title || 'Recommended listing'} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" /> : <Map className="m-5 h-7 w-7 text-blue-400" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-sm font-bold text-slate-950">{listing?.title || recommendation.reasoning}</h3>
                              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-500">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                <span>{listing?.averageRating?.toFixed?.(1) || recommendation.score?.toFixed?.(1) || 'Top match'}</span>
                              </div>
                              <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{listing?.city || listing?.category || recommendation.reasoning}</p>
                              <p className="mt-1 text-xs font-bold text-slate-700">
                                {listing?.basePrice ? `From ${formatCurrency(listing.basePrice, listing.currency || 'USD')}` : 'Marketplace match'}
                              </p>
                            </div>
                          </>
                        );
                        const cardKey = `${recommendation.rank}-${listing?.id ?? listing?.title}`;
                        return detailPath ? (
                          <Link key={cardKey} to={detailPath} className="group flex min-w-0 gap-3 rounded-2xl border border-slate-100 p-2.5 transition hover:border-blue-100 hover:bg-blue-50/40">
                            {cardContent}
                          </Link>
                        ) : (
                          <article key={cardKey} className="group flex min-w-0 gap-3 rounded-2xl border border-slate-100 p-2.5 transition hover:border-blue-100 hover:bg-blue-50/40">
                            {cardContent}
                          </article>
                        );
                      })
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-6 text-center">
                        <svg aria-hidden="true" className="mx-auto h-24 w-32" viewBox="0 0 180 120" fill="none">
                          <path d="M45 87C57 58 84 43 116 54C138 62 151 77 166 72V120H45V87Z" fill="#DBEAFE" />
                          <path d="M56 88C69 71 84 67 103 77C121 86 136 84 153 70" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
                          <path d="M72 48C72 36 82 26 94 26C106 26 116 36 116 48V91H72V48Z" fill="#FDE68A" />
                          <path d="M60 90H128C128 69 113 53 94 53C75 53 60 69 60 90Z" fill="#34D399" />
                          <path d="M39 78C38 51 47 31 66 17M66 17C74 36 71 58 54 81M66 17C53 30 42 45 31 64" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" />
                          <circle cx="132" cy="32" r="10" fill="#FBBF24" />
                        </svg>
                        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-600">
                          Recommendations will appear here after we find the best matches for you.
                        </p>
                        <Button type="button" variant="outline" className="mt-5 h-11 w-full rounded-xl border-blue-200 font-bold text-blue-700">
                          View more recommendations <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {currentRecommendations.length > 0 && (
                    <Button type="button" variant="outline" className="mt-4 h-11 w-full rounded-xl border-blue-100 font-bold text-blue-700">
                      View more <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </aside>
              </div>
            </div>
          ) : (
            <EmptyPlannerState />
          )}
        </section>
      </div>
    </main>
  );
};
