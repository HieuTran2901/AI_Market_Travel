
import { Hotel, Map, Pin, Check, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { AssistantListingRecommendation, SavedTrip, TripPlanResponse } from '@/types/ai';
import { ChatItinerary, TravelChatMessage } from '../types/chat.types';
import { FlightOfferCard } from '../../flights/FlightOfferCard';
import { FlightDealCard } from '../../flights/FlightDealCard';
import { FlightSummaryLabels } from '../../flights/FlightSummaryLabels';
import { getListingDetailPath } from '@/utils/listingRoutes';
import { formatMoney, formatTime, formatDateRange, budgetStatusClass, formatListingPrice, safeAmount, resolvedBudgetTotal, isDatabaseListing, getListingImage, normalizeTripPlanForChat, budgetStatusText, formatBudget } from '../utils/messageFormatter';

export const ChatItineraryCard = ({ itinerary, images = [] }: { itinerary: TripPlanResponse; images?: string[] }) => {
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

export const MapMiniPreview = ({ destination }: { destination: string }) => (
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

export const TravelFallbackImage = ({ destination }: { destination: string }) => (
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

export const SavedTripSuccessCard = ({ itinerary, trip }: { itinerary: ChatItinerary; trip: SavedTrip }) => {
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

export const CompactRecommendationCards = ({ recommendations }: { recommendations: AssistantListingRecommendation[] }) => {
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

export const TravelMessage = ({
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


export const CompactChatItineraryCard = ({
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

