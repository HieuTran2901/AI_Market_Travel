import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, DollarSign, Eye, Star } from 'lucide-react';
import { listingService } from '@/services/listingService';
import { StateBlock } from '@/components/ui/StateBlock';
import { ListingResponse } from '@/types/listing';

function money(value: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export const ProviderAnalyticsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['provider-analytics-listings'],
    queryFn: () => listingService.getMyListings({ page: 0, size: 100 }),
  });

  const listings = data?.data?.content || [];
  const currency = listings[0]?.currency || 'VND';
  const totalViews = listings.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
  const totalReviews = listings.reduce((sum, listing) => sum + (listing.reviewCount || 0), 0);
  const activeListings = listings.filter(listing => listing.status === 'ACTIVE').length;
  const catalogValue = listings.reduce((sum, listing) => sum + (listing.basePrice || 0), 0);
  const topListings = [...listings].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 6);

  if (isLoading) {
    return <StateBlock variant="loading" title="Loading analytics" description="Fetching provider listing metrics." className="border-0 bg-white shadow-sm dark:bg-slate-900/90" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Analytics</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">Provider analytics</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
          Metrics currently available from provider listing data. Historical booking and revenue charts are not shown without a real endpoint.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Listing views" value={totalViews.toLocaleString()} icon={Eye} />
        <Metric label="Reviews" value={totalReviews.toLocaleString()} icon={Star} />
        <Metric label="Active listings" value={activeListings.toLocaleString()} icon={Activity} />
        <Metric label="Catalog value" value={money(catalogValue, currency)} icon={DollarSign} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-2xl">Top listings by views</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Based on current listing view counters.</p>
            </div>
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          {topListings.length > 0 ? (
            <div className="mt-6 space-y-4">
              {topListings.map(listing => <ListingBar key={listing.id} listing={listing} max={Math.max(...topListings.map(item => item.viewCount || 0), 1)} />)}
            </div>
          ) : (
            <StateBlock title="No listing metrics yet" description="Create listings to begin collecting views and review metrics." className="mt-5 border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40" />
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90 xl:p-6">
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">Historical chart</h2>
          <StateBlock
            title="No time-series endpoint"
            description="Recharts is not installed and the frontend does not expose provider historical analytics data, so no fake line chart is rendered."
            className="mt-5 border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40"
          />
        </div>
      </section>
    </div>
  );
};

const Metric = ({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) => (
  <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/90">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 break-words text-xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-2xl">{value}</p>
      </div>
    </div>
  </div>
);

const ListingBar = ({ listing, max }: { listing: ListingResponse; max: number }) => {
  const percent = Math.max(4, Math.round(((listing.viewCount || 0) / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-black text-slate-950 dark:text-slate-50">{listing.title}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{listing.city || listing.country}</p>
        </div>
        <span className="shrink-0 text-sm font-black text-slate-950 dark:text-slate-100">{(listing.viewCount || 0).toLocaleString()}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
