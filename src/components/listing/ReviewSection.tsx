import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Heart,
  Lock,
  MapPin,
  MessageSquareText,
  MoreVertical,
  PenLine,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  ThumbsUp,
  UserRound,
  Users,
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
          className={`${sizeClass} ${index + 1 <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

const RatingOverviewCard = ({ rating, count, hasReviews }: { rating?: number; count: number; hasReviews: boolean }) => (
  <div className="motion-fade-up relative rounded-[1.4rem] border border-blue-100 bg-white/90 p-6 text-center shadow-sm ring-1 ring-slate-100/80 backdrop-blur">
    <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
      <Star className="h-5 w-5 fill-blue-600 text-blue-600" />
    </div>

    {hasReviews ? (
      <>
        <p className="mt-8 text-6xl font-black tracking-tight text-slate-950">{Number(rating).toFixed(1)}</p>
        <div className="mt-4 flex justify-center">
          <StarRating value={Number(rating)} size="lg" />
        </div>
        <p className="mt-3 text-base font-bold text-slate-950">{count.toLocaleString()} traveler {count === 1 ? 'review' : 'reviews'}</p>
        <div className="mx-auto my-5 h-px max-w-[260px] bg-slate-200" />
        <div className="flex items-start gap-3 text-left">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-950">Travelers love this experience!</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Consistently strong ratings for quality, service, and value.</p>
          </div>
        </div>
      </>
    ) : (
      <>
        <p className="mt-12 text-3xl font-black tracking-tight text-slate-950">No reviews yet</p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">Reviews will appear after travelers complete bookings and share feedback.</p>
      </>
    )}
  </div>
);

const RatingBreakdownCard = ({ summary, totalReviews, hasReviews, isLoading }: { summary?: ReviewSummary; totalReviews: number; hasReviews: boolean; isLoading: boolean }) => (
  <div className="motion-fade-up rounded-[1.4rem] border border-slate-200 bg-white/90 p-5 shadow-sm ring-1 ring-slate-100/80">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-lg font-bold text-slate-950">Rating breakdown</h3>
      <SlidersHorizontal className="h-4 w-4 text-blue-600" />
    </div>

    {isLoading ? (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-6 animate-pulse rounded-lg bg-slate-100" />)}
      </div>
    ) : hasReviews ? (
      <div className="space-y-3">
        {(summary?.ratingDistribution ?? []).map(item => {
          const percentage = totalReviews > 0 ? (item.count / totalReviews) * 100 : 0;
          return (
            <div key={item.rating} className="grid grid-cols-[56px_1fr_38px] items-center gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.rating} {item.rating === 1 ? 'star' : 'stars'}</span>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                  aria-label={`${item.rating} star reviews: ${item.count}`}
                />
              </div>
              <span className="text-right font-bold text-slate-900">{item.count}</span>
            </div>
          );
        })}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">{totalReviews.toLocaleString()} reviews</span>
          <span className="font-bold text-blue-700">{summary?.averageRating ? Number(summary.averageRating).toFixed(1) : '0.0'} average</span>
        </div>
      </div>
    ) : (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
        Rating bars will appear once reviews are published.
      </p>
    )}
  </div>
);

const TravelerLoveCard = () => {
  const items = [
    { label: 'Great location', text: 'Location signal', icon: MapPin, tone: 'bg-blue-50 text-blue-700 ring-blue-100' },
    { label: 'Friendly hosts', text: 'Provider care', icon: Users, tone: 'bg-violet-50 text-violet-700 ring-violet-100' },
    { label: 'Smooth booking', text: 'Platform flow', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  ];

  return (
    <div className="motion-fade-up rounded-[1.4rem] border border-slate-200 bg-white/90 p-5 shadow-sm ring-1 ring-slate-100/80">
      <h3 className="text-lg font-bold text-slate-950">What travelers love</h3>
      <p className="mt-1 text-xs text-slate-500">Platform highlights, not category analytics.</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {items.map(item => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${item.tone}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-bold leading-4 text-slate-950">{item.label}</p>
            <p className="mt-1 text-[11px] font-semibold text-blue-600">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReviewCard = ({ review, index }: { review: Review; index: number }) => {
  const tripType = review.tripType ?? 'OTHER';

  return (
    <article
      className="motion-fade-up group/review rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-lg hover:shadow-slate-200/80"
      style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}
    >
      <div className="grid gap-3 sm:grid-cols-[52px_1fr_auto] sm:items-start">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 shadow-sm">
          {review.userAvatarUrl ? (
            <img src={review.userAvatarUrl} alt={`${review.userDisplayName} avatar`} className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-6 w-6" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 sm:block">
            <div>
              <h3 className="font-bold leading-tight text-slate-950">{review.userDisplayName}</h3>
              <p className="mt-1 text-xs text-slate-500">{formatDate(review.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <StarRating value={review.rating} />
              <TripBadge tripType={tripType} />
            </div>
          </div>

          {review.title && <p className="mt-3 line-clamp-1 text-sm font-bold text-slate-950">{review.title}</p>}
          <p className="mt-1.5 line-clamp-3 max-w-3xl text-sm leading-6 text-slate-600">{review.comment}</p>

          {review.providerReply && (
            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Provider reply</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700">{review.providerReply.replyText}</p>
            </div>
          )}

          <button
            type="button"
            disabled
            className="mt-3 inline-flex items-center gap-2 rounded-full py-1 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700 disabled:cursor-not-allowed"
            title="Helpful voting is future work."
          >
            <ThumbsUp className="h-4 w-4" />
            Helpful ({review.helpfulCount})
          </button>
        </div>

        <div className="hidden min-w-[168px] items-start justify-end gap-3 sm:flex">
          <div className="space-y-2 text-right">
            <StarRating value={review.rating} />
            <TripBadge tripType={tripType} />
          </div>
          <button
            type="button"
            disabled
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed"
            aria-label="Review options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
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
  const [visibleCount, setVisibleCount] = useState(pageStep);
  const [draftRating, setDraftRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [tripType, setTripType] = useState<TripType>('OTHER');
  const [bookingId, setBookingId] = useState('');
  const [formMessage, setFormMessage] = useState<ReviewFormMessage | null>(null);

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
      await createReviewMutation.mutateAsync({
        bookingId: Number(selectedBookingId),
        rating: draftRating,
        title: title.trim(),
        comment: comment.trim(),
        tripType,
      });

      setFormMessage({ type: 'success', text: 'Review submitted successfully.' });
      setDraftRating(0);
      setTitle('');
      setComment('');
      setBookingId('');
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
    <section className="motion-fade-up w-full py-12" aria-labelledby="reviews-heading">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <RatingOverviewCard rating={displayRating} count={Number(totalReviews)} hasReviews={hasReviews} />
          <RatingBreakdownCard summary={summary} totalReviews={Number(totalReviews)} hasReviews={hasReviews} isLoading={summaryQuery.isLoading} />
          <TravelerLoveCard />
        </aside>

        <div className="min-w-0 rounded-[1.6rem] border border-blue-100 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80 backdrop-blur sm:p-5">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 id="reviews-heading" className="text-2xl font-bold text-slate-950">Guest reviews</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Real feedback from travelers who booked and experienced this listing.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={sort} onChange={event => updateSort(event.target.value)} className="h-10 min-w-[140px] rounded-full border-slate-200 bg-white px-4 text-sm shadow-sm">
                <option value="createdAt,desc">Newest</option>
                <option value="rating,desc">Highest rating</option>
                <option value="rating,asc">Lowest rating</option>
              </Select>
              <Select value={ratingFilter} onChange={event => updateRatingFilter(event.target.value)} className="h-10 min-w-[150px] rounded-full border-slate-200 bg-white px-4 text-sm shadow-sm">
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} stars</option>)}
              </Select>
            </div>
          </div>

          {reviewsQuery.isLoading ? (
            <ReviewSkeleton />
          ) : reviews.length > 0 ? (
            <>
              <div className="space-y-3">
                {reviews.map((review, index) => <ReviewCard key={review.id} review={review} index={index} />)}
              </div>
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">Showing {reviews.length} of {loadedTotal} reviews</p>
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
