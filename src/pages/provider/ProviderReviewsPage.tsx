import React from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { MessageSquareText, Star } from 'lucide-react';
import { listingService } from '@/services/listingService';
import { reviewService } from '@/services/reviewService';
import { StateBlock } from '@/components/ui/StateBlock';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListingResponse } from '@/types/listing';
import { Review } from '@/types/review';

const ratingText = (value?: number) => (value ? value.toFixed(1) : 'New');

const reviewDate = (value: string) => new Date(value).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const ProviderReviewsPage: React.FC = () => {
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['provider-review-listings'],
    queryFn: () => listingService.getMyListings({ page: 0, size: 100 }),
  });

  const listings = listingsData?.data?.content || [];
  const reviewQueries = useQueries({
    queries: listings.map(listing => ({
      queryKey: ['provider-listing-reviews', listing.id],
      queryFn: () => reviewService.getListingReviews(listing.id, { page: 0, size: 5, sort: 'createdAt,desc' }),
      enabled: listings.length > 0,
    })),
  });

  const reviews = reviewQueries.flatMap((query, index) => {
    const listing = listings[index];
    return (query.data?.data?.content || []).map(review => ({ listing, review }));
  });

  const totalReviews = listings.reduce((sum, listing) => sum + (listing.reviewCount || 0), 0);
  const weightedRating = listings.reduce((sum, listing) => sum + ((listing.averageRating || 0) * (listing.reviewCount || 0)), 0);
  const averageRating = totalReviews > 0 ? weightedRating / totalReviews : undefined;
  const loadingReviews = reviewQueries.some(query => query.isLoading);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Reviews & Ratings</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">Guest feedback</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
          Real reviews collected from your current provider listings.
        </p>
      </section>

      {isLoading ? (
        <StateBlock variant="loading" title="Loading reviews" description="Fetching provider listings and review summaries." className="border-0 bg-white shadow-sm dark:bg-slate-900/90" />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="Overall rating" value={ratingText(averageRating)} helper={totalReviews > 0 ? 'Weighted across reviewed listings' : 'No published ratings yet'} icon={Star} />
            <SummaryCard label="Total reviews" value={totalReviews.toLocaleString()} helper="Across all provider listings" icon={MessageSquareText} />
            <SummaryCard label="Reviewed listings" value={listings.filter(item => item.reviewCount > 0).length.toLocaleString()} helper={`${listings.length} listings in catalog`} icon={Star} />
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-2xl">Listings by rating</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Ratings come directly from listing review totals.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {listings.map(listing => <ListingRatingCard key={listing.id} listing={listing} />)}
            </div>
            {listings.length === 0 && (
              <StateBlock title="No listings yet" description="Reviews will appear after you publish listings and guests submit feedback." className="mt-5 border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40" />
            )}
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-2xl">Latest review activity</h2>
            {loadingReviews ? (
              <StateBlock variant="loading" title="Loading latest reviews" description="Fetching recent comments for each listing." className="mt-5 border-0 bg-slate-50 shadow-none dark:bg-slate-950/40" />
            ) : reviews.length > 0 ? (
              <div className="mt-5 space-y-3">
                {reviews.map(({ listing, review }) => <ReviewCard key={`${listing.id}-${review.id}`} listing={listing} review={review} />)}
              </div>
            ) : (
              <StateBlock title="No review comments yet" description="Recent guest comments will appear here after travelers review your listings." className="mt-5 border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40" />
            )}
          </section>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: React.ElementType }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">{value}</p>
      </div>
    </div>
    <p className="mt-4 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{helper}</p>
  </div>
);

const ListingRatingCard = ({ listing }: { listing: ListingResponse }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-950/40">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="line-clamp-1 text-sm font-black text-slate-950 dark:text-slate-50">{listing.title}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{listing.city || listing.country}</p>
      </div>
      <StatusBadge kind="listing" status={listing.status} />
    </div>
    <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/80">
      <span className="inline-flex items-center gap-1 text-sm font-black text-slate-950 dark:text-slate-100">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        {ratingText(listing.averageRating)}
      </span>
      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{listing.reviewCount || 0} reviews</span>
    </div>
  </div>
);

const ReviewCard = ({ listing, review }: { listing: ListingResponse; review: Review }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-100 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-950/40 dark:hover:border-blue-400/30">
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="flex min-w-0 items-center gap-3 md:w-64 md:shrink-0">
        {review.userAvatarUrl ? (
          <img src={review.userAvatarUrl} alt={review.userDisplayName} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
            {review.userDisplayName?.slice(0, 2).toUpperCase() || 'G'}
          </div>
        )}
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-black text-slate-950 dark:text-slate-50">{review.userDisplayName}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{review.tripType ? review.tripType.toLowerCase() : 'Traveler'}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1 border-slate-100 dark:border-slate-700/60 md:border-l md:pl-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-sm font-black text-slate-950 dark:text-slate-100">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {review.rating}/5
          </span>
          <span className="text-xs font-bold text-slate-400">{reviewDate(review.createdAt)}</span>
        </div>
        <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600">{listing.title}</p>
        {review.title && <h3 className="mt-2 text-base font-black text-slate-950 dark:text-slate-50">{review.title}</h3>}
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{review.comment}</p>
      </div>
    </div>
  </article>
);
