import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Heart,
  ImagePlus,
  Info,
  Lock,
  MapPin,
  MessageSquareText,
  MoreVertical,
  PenLine,
  Search,
  ShieldCheck,
  Star,
  ThumbsUp,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import api from '@/services/api';
import { reviewService } from '@/services/reviewService';
import { ApiResponse, PageResponse } from '@/types';
import { Review, ReviewCreateRequest, ReviewSummary, TripType } from '@/types/review';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services/storageService';

type ReviewSectionProps = {
  listingId: number;
  averageRating?: number;
  reviewCount: number;
  listingTitle: string;
};

type BookingOption = {
  id: number;
  bookingNumber: string;
  listingId: number;
  status: string;
};

type ReviewFormMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
};

type LocalReviewImage = {
  id: string;
  name: string;
  url: string;
  file: File;
};

const tripTypes: TripType[] = ['FAMILY', 'COUPLE', 'SOLO', 'BUSINESS', 'FRIENDS', 'OTHER'];
const pageStep = 4;

const tripBadgeStyles: Record<TripType, string> = {
  FAMILY: 'bg-blue-50 text-blue-700 ring-blue-100',
  COUPLE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  SOLO: 'bg-violet-50 text-violet-700 ring-violet-100',
  BUSINESS: 'bg-slate-100 text-slate-700 ring-slate-200',
  FRIENDS: 'bg-orange-50 text-orange-700 ring-orange-100',
  OTHER: 'bg-gray-50 text-gray-700 ring-gray-200',
};

const TripBadge = ({ tripType }: { tripType: TripType }) => {
  const iconClassName = 'h-3.5 w-3.5';
  const icon = {
    FAMILY: <Users className={iconClassName} />,
    COUPLE: <Heart className={iconClassName} />,
    SOLO: <UserRound className={iconClassName} />,
    BUSINESS: <Briefcase className={iconClassName} />,
    FRIENDS: <Users className={iconClassName} />,
    OTHER: <MessageSquareText className={iconClassName} />,
  }[tripType];

  return (
    <Badge className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 ${tripBadgeStyles[tripType]}`}>
      {icon}
      {formatTripType(tripType)}
    </Badge>
  );
};

function clampRating(value: number) {
  return Math.max(0, Math.min(5, value));
}

function formatTripType(value?: TripType) {
  if (!value) return null;
  return value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function formatKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().replace(/\b\w/g, char => char.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function getApiErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: string;
      errorCode?: string;
      errors?: Record<string, string>;
      response?: { data?: { message?: string; errors?: Record<string, string> } };
    };

    const fieldErrors = candidate.errors || candidate.response?.data?.errors;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      return Object.values(fieldErrors).join(' ');
    }

    if (candidate.message) {
      return candidate.message;
    }

    if (candidate.response?.data?.message) {
      return candidate.response.data.message;
    }

    if (candidate.errorCode === 'REVIEW_ALREADY_EXISTS') {
      return 'You have already reviewed this booking.';
    }
  }

  return 'Unable to submit your review right now. Please try again.';
}

const StarRating = ({ value, size = 'sm' }: { value: number; size?: 'xs' | 'sm' | 'lg' }) => {
  const rating = clampRating(value);
  const sizeClass = size === 'lg' ? 'h-6 w-6' : size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`motion-star-reveal ${sizeClass} ${index + 1 <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          style={{ animationDelay: `${index * 60}ms` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

const AnimatedRatingNumber = ({ value }: { value?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!value) {
      setDisplayValue(0);
      return;
    }

    const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = 780;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{displayValue.toFixed(1)}</>;
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const day = 1000 * 60 * 60 * 24;

  if (Number.isNaN(date.getTime())) return '';
  if (diff < day) return 'Today';
  if (diff < day * 2) return 'Yesterday';
  if (diff < day * 30) return `${Math.floor(diff / day)} days ago`;
  return formatDate(value);
}

function normalizedDistribution(summary?: ReviewSummary) {
  const counts = new Map((summary?.ratingDistribution ?? []).map(item => [item.rating, item.count]));
  return [5, 4, 3, 2, 1].map(rating => ({ rating, count: counts.get(rating) ?? 0 }));
}

function categoryScoreEntries(summary?: ReviewSummary) {
  return Object.entries(summary?.categoryScores ?? {})
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort(([, a], [, b]) => b - a);
}

type NormalizedReviewImage = {
  key: string;
  url: string;
  alt: string;
};

function normalizeReviewImages(review: Review): NormalizedReviewImage[] {
  const imageItems = [
    ...(review.images ?? []),
    ...(review.media ?? []),
    ...(review.attachments ?? []),
  ];

  const objectUrls = imageItems
    .map((image, index) => ({
      key: String(image.id ?? image.imageUrl ?? image.url ?? index),
      url: image.imageUrl || image.url || '',
      alt: image.altText || `Review photo ${index + 1} by ${review.userDisplayName}`,
    }))
    .filter((image) => Boolean(image.url));

  const stringUrls = (review.imageUrls ?? [])
    .map((url, index) => ({
      key: url,
      url,
      alt: `Review photo ${objectUrls.length + index + 1} by ${review.userDisplayName}`,
    }))
    .filter((image) => Boolean(image.url));

  const seen = new Set<string>();
  return [...objectUrls, ...stringUrls].filter((image) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

const RatingSummaryDashboard = ({
  rating,
  count,
  summary,
  hasReviews,
  isLoading,
}: {
  rating?: number;
  count: number;
  summary?: ReviewSummary;
  hasReviews: boolean;
  isLoading: boolean;
}) => {
  const insights = categoryScoreEntries(summary).slice(0, 6);
  const insightStyles = [
    { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
    { icon: MapPin, tone: 'bg-violet-50 text-violet-600 ring-violet-100' },
    { icon: Star, tone: 'bg-amber-50 text-amber-600 ring-amber-100' },
    { icon: Users, tone: 'bg-blue-50 text-blue-600 ring-blue-100' },
    { icon: Heart, tone: 'bg-rose-50 text-rose-600 ring-rose-100' },
    { icon: ShieldCheck, tone: 'bg-teal-50 text-teal-600 ring-teal-100' },
  ];
  const displayedRating = hasReviews && rating ? Number(rating).toFixed(1) : 'New';

  return (
    <div className="motion-fade-up">
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="relative h-full min-w-0 overflow-hidden rounded-[24px] border border-blue-100 bg-blue-50/70 p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
          <svg aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-36 w-36 text-blue-500 opacity-[0.08]" viewBox="0 0 180 180" fill="none">
            <path d="M96 150C96 118 114 94 140 82" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <path d="M118 152C118 128 130 110 152 100" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <rect x="86" y="82" width="46" height="72" rx="12" stroke="currentColor" strokeWidth="4" />
            <path d="M94 96H124M94 108H124M94 120H116" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M40 152C58 126 72 126 90 152" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          {hasReviews ? (
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-sm font-black text-blue-700 shadow-sm">
                <ThumbsUp className="h-4 w-4" />
                Excellent stay
              </span>
              <div className="mt-7 flex items-end gap-3">
                <span className="text-6xl font-black tracking-tight text-slate-950 sm:text-7xl"><AnimatedRatingNumber value={Number(rating)} /></span>
                <span className="mb-3 text-2xl font-black text-slate-500">/ 5</span>
              </div>
              <div className="mt-4">
                <StarRating value={Number(rating)} size="lg" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-600">Based on {count.toLocaleString()} {count === 1 ? 'review' : 'reviews'}</p>
              <div className="mt-8 flex items-center gap-3 border-t border-blue-100 pt-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                  <Star className="h-5 w-5 fill-blue-700" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">{displayedRating} average rating</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-500">Guests love this place.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Overall rating</p>
              <p className="mt-6 text-3xl font-black tracking-tight text-slate-950">No reviews yet</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">Reviews will appear after travelers complete bookings and share feedback.</p>
            </div>
          )}
        </div>

        <div className="h-full min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Rating breakdown</h3>
              <p className="text-xs font-semibold text-slate-500">Distribution by star rating.</p>
            </div>
            <Info className="h-4 w-4 text-slate-400" />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-6 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : hasReviews ? (
            <div className="space-y-4">
              {normalizedDistribution(summary).map(item => {
                const percentage = count > 0 ? (item.count / count) * 100 : 0;
                return (
                  <div key={item.rating} className="grid grid-cols-[46px_minmax(0,1fr)_34px] items-center gap-4 text-sm">
                    <span className="font-bold text-slate-700">{item.rating} <Star className="inline h-3.5 w-3.5 fill-amber-400 text-amber-400" /></span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                      <div
                        className="motion-rating-bar h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700 motion-reduce:transition-none"
                        style={{ width: `${percentage}%` }}
                        aria-label={`${item.rating} star reviews: ${item.count}`}
                      />
                    </div>
                    <span className="text-right font-black text-slate-900">{item.count}</span>
                  </div>
                );
              })}
              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
                <span className="font-semibold text-slate-500">{count.toLocaleString()} reviews</span>
                <span className="font-black text-blue-700">{summary?.averageRating ? Number(summary.averageRating).toFixed(1) : '0.0'} average</span>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500">
              Rating bars will appear once reviews are published.
            </p>
          )}
        </div>

        <div className="h-full min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <h3 className="text-lg font-black text-slate-950">What travelers love</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Based on review category scores when available.</p>
          {insights.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {insights.map(([key, score], index) => {
                const style = insightStyles[index % insightStyles.length];
                const Icon = style.icon;
                return (
                  <div key={key} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950">{formatKey(key)}</p>
                    </div>
                    <span className="shrink-0 text-base font-black text-slate-950">{Number(score).toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              Traveler insight chips will appear when category review scores are available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewCard = ({ review, index, categoryLabels }: { review: Review; index: number; categoryLabels: string[] }) => {
  const tripType = review.tripType ?? 'OTHER';
  const reviewMedia = normalizeReviewImages(review);
  const hasMedia = reviewMedia.length > 0;

  return (
    <article
      className="motion-fade-up group/review rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/80 sm:p-6"
      style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex min-w-0 gap-4 lg:block lg:border-r lg:border-slate-200 lg:pr-6">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 shadow-sm ring-4 ring-blue-50 sm:h-16 sm:w-16">
            {review.userAvatarUrl ? (
              <img src={review.userAvatarUrl} alt={`${review.userDisplayName} avatar`} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
            )}
            {review.bookingId && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white">
                <CheckCircle2 className="h-3 w-3" />
              </span>
            )}
          </div>
          <div className="min-w-0 lg:mt-4">
            <h3 className="truncate text-base font-black leading-tight text-slate-950">{review.userDisplayName}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">Traveler</p>
            <div className="mt-3 space-y-2 text-sm font-semibold text-slate-500">
              <p className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <StarRating value={review.rating} />
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">{review.rating}/5</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-500">{formatRelativeDate(review.createdAt)}</span>
              <button
                type="button"
                disabled
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed"
                aria-label="Review options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>

          <h3 className="mt-4 text-lg font-black leading-7 text-slate-950">{review.title || 'Traveler feedback'}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{review.comment}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <TripBadge tripType={tripType} />
            {categoryLabels.slice(0, 5).map(label => (
              <span key={label} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                {label}
              </span>
            ))}
          </div>

          {hasMedia && (
            <div
              className={reviewMedia.length === 1
                ? 'mt-5 max-w-[420px]'
                : 'mt-5 grid max-w-[640px] grid-cols-1 gap-3 min-[420px]:grid-cols-2'}
              aria-label={`${review.userDisplayName} review photos`}
            >
              {reviewMedia.slice(0, 4).map((image, imageIndex) => {
                const remainingCount = reviewMedia.length - 4;
                const showOverlay = imageIndex === 3 && remainingCount > 0;
                return (
                  <button
                    key={image.key}
                    type="button"
                    className={reviewMedia.length === 1
                      ? 'group/media relative block aspect-[16/9] h-[220px] w-full overflow-hidden rounded-[18px] bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      : 'group/media relative block h-[150px] w-full overflow-hidden rounded-2xl bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'}
                    onClick={() => window.open(image.url, '_blank', 'noopener,noreferrer')}
                    aria-label={`Open review photo ${imageIndex + 1}`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover/media:scale-[1.02]"
                    />
                    {showOverlay && (
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-lg font-black text-white backdrop-blur-[1px]">
                        +{remainingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {review.providerReply && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Provider reply</p>
              <p className="mt-1 text-xs leading-5 text-slate-700">{review.providerReply.replyText}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            {review.bookingId ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified stay
              </span>
            ) : (
              <span className="text-sm font-semibold text-slate-500">{formatDate(review.createdAt)}</span>
            )}
            <button
              type="button"
              disabled
              className="motion-helpful-button inline-flex items-center gap-2 rounded-full py-1 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-700 disabled:cursor-not-allowed"
              title="Helpful voting is future work."
            >
              <ThumbsUp className="h-4 w-4" />
              Helpful ({review.helpfulCount})
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const ReviewSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="h-36 animate-pulse rounded-[1.35rem] bg-slate-100" />
    ))}
  </div>
);

async function getMyBookings() {
  const response = await api.get<ApiResponse<PageResponse<BookingOption>>>('/bookings/my', {
    params: { page: 0, size: 100, sort: 'createdAt,desc' },
  });
  return response.data;
}

export const ReviewSection = ({ listingId, averageRating, reviewCount, listingTitle }: ReviewSectionProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [sort, setSort] = useState('createdAt,desc');
  const [ratingFilter, setRatingFilter] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageStep);
  const [draftRating, setDraftRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [tripType, setTripType] = useState<TripType>('OTHER');
  const [bookingId, setBookingId] = useState('');
  const [formMessage, setFormMessage] = useState<ReviewFormMessage | null>(null);
  const [reviewImages, setReviewImages] = useState<LocalReviewImage[]>([]);
  const reviewImagesRef = useRef<LocalReviewImage[]>([]);

  const summaryQuery = useQuery({
    queryKey: ['review-summary', listingId],
    queryFn: () => reviewService.getListingReviewSummary(listingId),
  });

  const reviewsQuery = useQuery({
    queryKey: ['listing-reviews', listingId, sort, ratingFilter, visibleCount],
    queryFn: () => reviewService.getListingReviews(listingId, {
      page: 0,
      size: visibleCount,
      sort,
      rating: ratingFilter ? Number(ratingFilter) : undefined,
    }),
  });

  const bookingsQuery = useQuery({
    queryKey: ['review-eligible-bookings', listingId],
    queryFn: getMyBookings,
    enabled: isAuthenticated,
  });

  const summary: ReviewSummary | undefined = summaryQuery.data?.data;
  const reviews = reviewsQuery.data?.data?.content ?? [];
  const loadedTotal = reviewsQuery.data?.data?.totalElements ?? 0;
  const totalReviews = summary?.reviewCount ?? reviewCount ?? 0;
  const displayRating = summary?.averageRating ?? averageRating;
  const hasReviews = Boolean(displayRating && totalReviews > 0);
  const canLoadMore = reviews.length < loadedTotal;
  const reviewCategoryLabels = categoryScoreEntries(summary).map(([key]) => formatKey(key));
  const visibleReviews = useMemo(() => {
    const query = reviewSearch.trim().toLowerCase();
    if (!query) return reviews;

    return reviews.filter(review =>
      [
        review.userDisplayName,
        review.title,
        review.comment,
        formatTripType(review.tripType),
      ].filter(Boolean).some(value => String(value).toLowerCase().includes(query))
    );
  }, [reviews, reviewSearch]);
  const reviewedBookingIds = useMemo(
    () => new Set(reviews.map(review => review.bookingId).filter((id): id is number => typeof id === 'number')),
    [reviews]
  );

  const completedBookingsForListing = useMemo(() => {
    const bookings = bookingsQuery.data?.data?.content ?? [];
    return bookings.filter(booking =>
      booking.listingId === listingId
      && ['CONFIRMED', 'COMPLETED'].includes(booking.status)
    );
  }, [bookingsQuery.data, listingId]);

  const eligibleBookings = useMemo(() => {
    return completedBookingsForListing.filter(booking => !reviewedBookingIds.has(booking.id));
  }, [completedBookingsForListing, reviewedBookingIds]);

  const hasReviewedCurrentBooking = completedBookingsForListing.some(booking => reviewedBookingIds.has(booking.id));

  const selectedBookingId = bookingId || (eligibleBookings[0]?.id ? String(eligibleBookings[0].id) : '');

  useEffect(() => {
    reviewImagesRef.current = reviewImages;
  }, [reviewImages]);

  useEffect(() => {
    return () => {
      reviewImagesRef.current.forEach(image => URL.revokeObjectURL(image.url));
    };
  }, []);

  const updateSort = (value: string) => {
    setSort(value);
    setVisibleCount(pageStep);
  };

  const updateRatingFilter = (value: string) => {
    setRatingFilter(value);
    setVisibleCount(pageStep);
  };

  const createReviewMutation = useMutation({
    mutationFn: (request: ReviewCreateRequest) => reviewService.createReview(listingId, request),
  });

  const handleReviewImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(file => file.type.startsWith('image/')).slice(0, 6);
    if (files.length === 0) return;

    setReviewImages(current => {
      const remainingSlots = Math.max(0, 6 - current.length);
      const nextImages = files.slice(0, remainingSlots).map(file => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      }));
      return [...current, ...nextImages];
    });
    event.target.value = '';
  };

  const removeReviewImage = (id: string) => {
    setReviewImages(current => {
      const image = current.find(item => item.id === id);
      if (image) URL.revokeObjectURL(image.url);
      return current.filter(item => item.id !== id);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);

    if (!selectedBookingId) {
      setFormMessage({ type: 'error', text: 'You can review this listing after completing a booking.' });
      return;
    }

    if (draftRating < 1 || draftRating > 5) {
      setFormMessage({ type: 'error', text: 'Choose a rating from 1 to 5 stars.' });
      return;
    }

    if (title.trim().length < 3) {
      setFormMessage({ type: 'error', text: 'Add a short review title.' });
      return;
    }

    if (comment.trim().length < 10) {
      setFormMessage({ type: 'error', text: 'Write at least 10 characters about your experience.' });
      return;
    }

    try {
      const uploadedImageUrls = reviewImages.length > 0
        ? await Promise.all(reviewImages.map(async image => {
            const response = await storageService.uploadImage(image.file, 'reviews');
            return response.data;
          }))
        : [];

      await createReviewMutation.mutateAsync({
        bookingId: Number(selectedBookingId),
        rating: draftRating,
        title: title.trim(),
        comment: comment.trim(),
        tripType,
        imageUrls: uploadedImageUrls.filter(Boolean),
      });

      setFormMessage({ type: 'success', text: 'Review submitted successfully.' });
      setDraftRating(0);
      setTitle('');
      setComment('');
      setBookingId('');
      reviewImages.forEach(image => URL.revokeObjectURL(image.url));
      setReviewImages([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['review-summary', listingId] }),
        queryClient.invalidateQueries({ queryKey: ['listing-reviews', listingId] }),
        queryClient.invalidateQueries({ queryKey: ['review-eligible-bookings', listingId] }),
        queryClient.invalidateQueries({ queryKey: ['listing'] }),
      ]);
    } catch (error) {
      const text = getApiErrorMessage(error);
      setFormMessage({
        type: 'error',
        text: text.toLowerCase().includes('already exists') ? 'You have already reviewed this booking.' : text,
      });
    }
  };

  return (
    <section className="motion-fade-up w-full" aria-labelledby="reviews-heading">
      <div className="w-full">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6 xl:p-7">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 id="reviews-heading" className="text-3xl font-black tracking-tight text-slate-950">Guest reviews</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Real feedback from travelers who booked and experienced this listing.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <label className="relative min-w-0 flex-1 xl:w-[320px] xl:flex-none">
                <span className="sr-only">Search reviews</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={reviewSearch}
                  onChange={event => setReviewSearch(event.target.value)}
                  placeholder="Search reviews..."
                  className="h-12 rounded-full border-slate-200 bg-white pl-10 text-sm shadow-sm"
                />
              </label>
              <Select value={ratingFilter} onChange={event => updateRatingFilter(event.target.value)} className="h-12 min-w-[150px] rounded-full border-slate-200 bg-white px-4 text-sm shadow-sm">
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} stars</option>)}
              </Select>
              <Select value={sort} onChange={event => updateSort(event.target.value)} className="h-12 min-w-[150px] rounded-full border-slate-200 bg-white px-4 text-sm shadow-sm">
                <option value="createdAt,desc">Newest</option>
                <option value="rating,desc">Highest rating</option>
                <option value="rating,asc">Lowest rating</option>
              </Select>
            </div>
          </div>

          <RatingSummaryDashboard
            rating={displayRating}
            count={Number(totalReviews)}
            summary={summary}
            hasReviews={hasReviews}
            isLoading={summaryQuery.isLoading}
          />

          {reviewsQuery.isLoading ? (
            <div className="mt-6">
              <ReviewSkeleton />
            </div>
          ) : visibleReviews.length > 0 ? (
            <>
              <div className="mt-6 space-y-4">
                <h3 className="text-xl font-black text-slate-950">{visibleReviews.length === 1 ? '1 review' : `${loadedTotal || visibleReviews.length} reviews`}</h3>
                {visibleReviews.map((review, index) => (
                  <ReviewCard key={review.id} review={review} index={index} categoryLabels={reviewCategoryLabels} />
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing {visibleReviews.length} of {loadedTotal} reviews
                  {reviewSearch.trim() ? ` matching "${reviewSearch.trim()}"` : ''}
                </p>
                {canLoadMore && (
                  <Button
                    variant="outline"
                    className="rounded-full bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => setVisibleCount(count => count + pageStep)}
                  >
                    Load more reviews
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-blue-200 bg-gradient-to-br from-white to-blue-50/50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-950">No written comments yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {listingTitle} does not have published comments matching this filter yet.
              </p>
              <Button variant="outline" className="mt-4 rounded-full bg-white" onClick={() => navigate('/search')}>
                Explore more listings
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/70 p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <PenLine className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-950">Write a review</h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Share your experience to help future travelers make the most of their trip.</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <Lock className="h-4 w-4" />
                You'll need to log in to write a review.
              </p>
              <Button className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-6 shadow-lg shadow-blue-500/20" onClick={() => navigate('/login')}>
                Log in to continue
              </Button>
            </div>
          ) : eligibleBookings.length === 0 && !bookingsQuery.isLoading ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-white/80 p-4">
              <CalendarDays className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-slate-950">Available after completing a booking</p>
                <p className="mt-1 text-sm text-slate-600">
                  {hasReviewedCurrentBooking
                    ? 'You have already reviewed this booking.'
                    : 'You can review this listing after completing a booking.'}
                </p>
              </div>
            </div>
          ) : (
            <form className="w-full lg:max-w-2xl" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                {eligibleBookings.length > 0 && (
                  <Select value={selectedBookingId} onChange={event => setBookingId(event.target.value)} aria-label="Eligible booking">
                    {eligibleBookings.map(booking => (
                      <option key={booking.id} value={booking.id}>{booking.bookingNumber} - {booking.status}</option>
                    ))}
                  </Select>
                )}
                <Select value={tripType} onChange={event => setTripType(event.target.value as TripType)} aria-label="Trip type">
                  {tripTypes.map(type => <option key={type} value={type}>{formatTripType(type)}</option>)}
                </Select>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[170px_1fr]">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Your rating</p>
                  <div className="flex gap-1" aria-label={`Selected rating ${draftRating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          key={value}
                          type="button"
                          className="rounded-lg p-1 text-amber-400 transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setDraftRating(value)}
                          aria-label={`Select ${value} star rating`}
                        >
                          <Star className={`h-5 w-5 ${value <= draftRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Input value={title} onChange={event => setTitle(event.target.value.slice(0, 150))} placeholder="Review title" aria-label="Review title" required minLength={3} maxLength={150} />
              </div>

              <Textarea
                value={comment}
                onChange={event => setComment(event.target.value.slice(0, 2000))}
                placeholder="Share what future travelers should know..."
                className="mt-3 min-h-24 bg-white/90"
                aria-label="Review comment"
                required
                minLength={10}
                maxLength={2000}
              />
              <div className="mt-3 rounded-2xl border border-dashed border-blue-200 bg-white/80 p-3">
                <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100">
                  <ImagePlus className="h-4 w-4" />
                  Add review photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleReviewImageChange}
                    aria-label="Add review photos"
                  />
                </label>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Photos are uploaded with your review and shown after submission.
                </p>
                {reviewImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {reviewImages.map(image => (
                      <div key={image.id} className="motion-upload-preview relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <img src={image.url} alt={image.name} className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-white"
                          onClick={() => removeReviewImage(image.id)}
                          aria-label={`Remove ${image.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500">
                  {formMessage ? (
                    <span
                      className={`font-medium ${
                        formMessage.type === 'success'
                          ? 'text-emerald-700'
                          : formMessage.type === 'error'
                            ? 'text-red-600'
                            : 'text-blue-700'
                      }`}
                      role={formMessage.type === 'error' ? 'alert' : 'status'}
                    >
                      {formMessage.text}
                    </span>
                  ) : (
                    <span>Minimum 10 characters. {comment.length}/2000</span>
                  )}
                </div>
                <Button type="submit" className="rounded-full" disabled={createReviewMutation.isPending || bookingsQuery.isLoading || !selectedBookingId}>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  {createReviewMutation.isPending ? 'Submitting...' : 'Submit review'}
                </Button>
              </div>
            </form>
          )}
        </div>
        </div>
      </div>
    </section>
  );
};
