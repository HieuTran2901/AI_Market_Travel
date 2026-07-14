import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Archive,
  ArrowRight,
  Ban,
  BarChart3,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Inbox,
  Layers,
  ListChecks,
  PlusCircle,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { listingService } from '@/services/listingService';
import { Button } from '@/components/ui/Button';
import { StateBlock } from '@/components/ui/StateBlock';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { ListingResponse, ListingStatus } from '@/types/listing';

type StatTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

const toneStyles: Record<StatTone, { icon: string; text: string; dot: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-600 ring-blue-100', text: 'text-blue-700', dot: '#2563eb' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100', text: 'text-emerald-700', dot: '#10b981' },
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-100', text: 'text-amber-700', dot: '#f59e0b' },
  rose: { icon: 'bg-rose-50 text-rose-600 ring-rose-100', text: 'text-rose-700', dot: '#ef4444' },
  violet: { icon: 'bg-violet-50 text-violet-600 ring-violet-100', text: 'text-violet-700', dot: '#8b5cf6' },
  slate: { icon: 'bg-slate-100 text-slate-600 ring-slate-200', text: 'text-slate-700', dot: '#94a3b8' },
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

function formatMoney(value: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCategory(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function getStatusCounts(listings: ListingResponse[]) {
  return {
    total: listings.length,
    active: listings.filter(listing => listing.status === 'ACTIVE').length,
    pending: listings.filter(listing => listing.status === 'PENDING_REVIEW').length,
    rejected: listings.filter(listing => listing.status === 'REJECTED').length,
    draft: listings.filter(listing => listing.status === 'DRAFT').length,
    archived: listings.filter(listing => listing.status === 'ARCHIVED' || listing.status === 'INACTIVE').length,
  };
}

function conicGradient(segments: Array<{ value: number; color: string }>, total: number) {
  if (total <= 0) return 'conic-gradient(#e2e8f0 0deg 360deg)';
  let cursor = 0;
  const stops = segments.map(segment => {
    const start = cursor;
    const size = (segment.value / total) * 360;
    cursor += size;
    return `${segment.color} ${start}deg ${cursor}deg`;
  });
  return `conic-gradient(${stops.join(', ')}, #e2e8f0 ${cursor}deg 360deg)`;
}

const MotionDiv = motion.div;

export const ProviderOverview: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const [period, setPeriod] = React.useState('last-7-days');

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['my-listings-stats'],
    queryFn: () => listingService.getMyListings({ page: 0, size: 100 }),
  });

  const listings = listingsData?.data?.content || [];
  const stats = getStatusCounts(listings);
  const totalViews = listings.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
  const totalReviews = listings.reduce((sum, listing) => sum + (listing.reviewCount || 0), 0);
  const catalogValue = listings.reduce((sum, listing) => sum + (listing.basePrice || 0), 0);
  const currency = listings[0]?.currency || 'VND';
  const recentListings = [...listings]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 4);

  const providerName = user?.providerProfile?.businessName || user?.fullName || 'Provider';
  const animationProps = prefersReducedMotion
    ? {}
    : { initial: 'hidden', animate: 'show', variants: containerVariants };

  const tasks = [
    ...(stats.draft > 0 ? [{
      title: 'Complete draft listings',
      description: `${stats.draft} draft ${stats.draft === 1 ? 'listing needs' : 'listings need'} pricing, photos, or details.`,
      icon: FileText,
      tone: 'amber' as StatTone,
      action: () => navigate('/provider/listings'),
    }] : []),
    ...(stats.rejected > 0 ? [{
      title: 'Review rejected listings',
      description: `${stats.rejected} ${stats.rejected === 1 ? 'listing requires' : 'listings require'} updates before resubmission.`,
      icon: Ban,
      tone: 'rose' as StatTone,
      action: () => navigate('/provider/listings'),
    }] : []),
    ...(stats.pending > 0 ? [{
      title: 'Track pending reviews',
      description: `${stats.pending} ${stats.pending === 1 ? 'listing is' : 'listings are'} waiting for marketplace approval.`,
      icon: Clock,
      tone: 'blue' as StatTone,
      action: () => navigate('/provider/listings'),
    }] : []),
    ...(stats.total === 0 ? [{
      title: 'Create your first listing',
      description: 'Publish a stay, tour, restaurant, vehicle, or local experience.',
      icon: PlusCircle,
      tone: 'emerald' as StatTone,
      action: () => navigate('/provider/listings/new'),
    }] : []),
  ];

  if (isLoading) {
    return (
      <StateBlock
        variant="loading"
        title="Loading dashboard"
        description="Fetching provider listing counts."
        className="border-0 bg-white shadow-sm dark:bg-slate-900/80 dark:text-slate-100"
      />
    );
  }

  return (
    <MotionDiv className="space-y-6" {...animationProps}>
      <MotionDiv
        variants={itemVariants}
        transition={{ duration: 0.45 }}
        className="flex min-w-0 flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-900/80 md:flex-row md:items-center md:justify-between xl:p-6"
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Overview</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl min-[1800px]:text-4xl">
            Welcome back, {providerName}! <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            Here's what's happening with your listings today.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Date range</label>
          <select
            value={period}
            onChange={event => setPeriod(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:focus:ring-blue-500/20"
          >
            <option value="last-7-days">Last 7 days</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="this-month">This month</option>
          </select>
        </div>
      </MotionDiv>

      <MotionDiv
        variants={containerVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[1800px]:grid-cols-6"
      >
        <KpiCard title="Total Listings" value={stats.total} icon={Layers} tone="blue" />
        <KpiCard title="Active Listings" value={stats.active} icon={Activity} tone="emerald" />
        <KpiCard title="Pending Review" value={stats.pending} icon={Clock} tone="amber" />
        <KpiCard title="Rejected" value={stats.rejected} icon={Ban} tone="rose" />
        <KpiCard title="Archived / Inactive" value={stats.archived} icon={Archive} tone="violet" />
        <KpiCard title="Drafts" value={stats.draft} icon={FileText} tone="slate" />
      </MotionDiv>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <div className="grid min-w-0 gap-6 min-[1800px]:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
            <MotionDiv variants={itemVariants} transition={{ duration: 0.45 }} className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-2xl">Performance Overview</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Available metrics from your current listing catalog.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20">
                    {period.replace(/-/g, ' ')}
                  </span>
                  <Button variant="ghost" size="sm" className="rounded-full text-blue-700" onClick={() => navigate('/provider/analytics')}>
                    Analytics <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 min-[1800px]:grid-cols-4">
                <MetricTile label="Views" value={totalViews.toLocaleString()} icon={Eye} tone="blue" onClick={() => navigate('/provider/analytics')} />
                <MetricTile label="Reviews" value={totalReviews.toLocaleString()} icon={Star} tone="amber" onClick={() => navigate('/provider/reviews')} />
                <MetricTile label="Active" value={stats.active.toLocaleString()} icon={TrendingUp} tone="emerald" onClick={() => navigate('/provider/listings')} />
                <MetricTile label="Catalog Value" value={formatMoney(catalogValue, currency)} icon={DollarSign} tone="violet" onClick={() => navigate('/provider/analytics')} />
              </div>
              <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center dark:border-slate-700/70 dark:bg-slate-950/40">
                <BarChart3 className="h-10 w-10 text-blue-500" />
                <h3 className="mt-3 text-base font-black text-slate-950 dark:text-slate-50">Historical chart not connected yet</h3>
                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  The frontend does not currently expose a provider time-series analytics endpoint, so this panel stays honest and avoids fake chart data.
                </p>
              </div>
            </MotionDiv>

            <ListingStatusCard stats={stats} />
          </div>

          <MotionDiv variants={itemVariants} transition={{ duration: 0.45 }} className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-2xl">Recent Listings</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Recently updated catalog items.</p>
              </div>
              <Button variant="ghost" className="rounded-full text-blue-700" onClick={() => navigate('/provider/listings')}>
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {recentListings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {recentListings.map(listing => <RecentListingCard key={listing.id} listing={listing} />)}
              </div>
            ) : (
              <StateBlock
                title="No listings yet"
                description="Create your first marketplace listing to start building your provider dashboard."
                actionLabel="Create Listing"
                onAction={() => navigate('/provider/listings/new')}
                className="border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40"
              />
            )}
          </MotionDiv>
        </div>

        <aside className="min-w-0 space-y-6">
          <TasksCard tasks={tasks} />
          <MotionDiv variants={itemVariants} transition={{ duration: 0.45 }} className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="flex items-start justify-between gap-4">
              <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-2xl">Recent Bookings</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Provider booking feed.</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full text-blue-700" onClick={() => navigate('/provider/bookings')}>
                View all
              </Button>
            </div>
            <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-center dark:border-slate-700/70 dark:bg-slate-950/40">
              <Inbox className="mx-auto h-9 w-9 text-slate-400" />
              <h3 className="mt-3 text-sm font-black text-slate-950 dark:text-slate-50">No provider booking feed yet</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                A provider bookings endpoint is not currently wired in this frontend.
              </p>
            </div>
          </MotionDiv>
          <MotionDiv variants={itemVariants} transition={{ duration: 0.45 }} className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm dark:border-blue-400/20 dark:from-blue-500/15 dark:via-slate-900 dark:to-cyan-500/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-black text-slate-950 dark:text-slate-50">Need help growing your business?</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Keep listings complete, active, and updated to improve marketplace visibility.
            </p>
            <div className="mt-5 grid gap-2">
              <Button variant="outline" className="rounded-2xl bg-white dark:bg-slate-950/40" onClick={() => navigate('/provider/profile')}>
                Provider Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="ghost" className="rounded-2xl text-blue-700" onClick={() => navigate('/provider/messages')}>
                Messages <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </MotionDiv>
        </aside>
      </div>
    </MotionDiv>
  );
};

const KpiCard = ({ title, value, icon: Icon, tone }: { title: string; value: number; icon: React.ElementType; tone: StatTone }) => {
  const styles = toneStyles[tone];
  return (
    <MotionDiv
      variants={itemVariants}
      transition={{ duration: 0.45 }}
      className="group min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:shadow-slate-950/40"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ${styles.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-5 text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">{value}</p>
        </div>
      </div>
    </MotionDiv>
  );
};

const MetricTile = ({ label, value, icon: Icon, tone, onClick }: { label: string; value: string; icon: React.ElementType; tone: StatTone; onClick?: () => void }) => {
  const styles = toneStyles[tone];
  return (
    <button type="button" onClick={onClick} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-950/40 dark:hover:border-blue-400/30">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 ${styles.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words text-lg font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-xl min-[1800px]:text-2xl">{value}</p>
    </button>
  );
};

const ListingStatusCard = ({ stats }: { stats: ReturnType<typeof getStatusCounts> }) => {
  const navigate = useNavigate();
  const rows: Array<{ label: string; value: number; tone: StatTone; status: ListingStatus | 'ARCHIVED_INACTIVE' }> = [
    { label: 'Active', value: stats.active, tone: 'emerald', status: 'ACTIVE' },
    { label: 'Drafts', value: stats.draft, tone: 'slate', status: 'DRAFT' },
    { label: 'Pending Review', value: stats.pending, tone: 'amber', status: 'PENDING_REVIEW' },
    { label: 'Rejected', value: stats.rejected, tone: 'rose', status: 'REJECTED' },
    { label: 'Archived', value: stats.archived, tone: 'violet', status: 'ARCHIVED_INACTIVE' },
  ];
  const gradient = conicGradient(rows.map(row => ({ value: row.value, color: toneStyles[row.tone].dot })), stats.total);

  return (
    <MotionDiv variants={itemVariants} transition={{ duration: 0.45 }} className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-2xl">Listing Status</h2>
      <div className="mt-6 flex min-w-0 flex-col items-center gap-6 sm:flex-row min-[1800px]:flex-col">
        <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: gradient }}>
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white shadow-inner dark:bg-slate-950">
            <span className="text-2xl font-black text-slate-950 dark:text-slate-50 xl:text-3xl">{stats.total}</span>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Total</span>
          </div>
        </div>
        <div className="min-w-0 w-full space-y-3">
          {rows.map(row => {
            const percentage = stats.total > 0 ? Math.round((row.value / stats.total) * 100) : 0;
            return (
              <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: toneStyles[row.tone].dot }} />
                  {row.label}
                </span>
                <span className="shrink-0 font-black text-slate-950 dark:text-slate-100">{row.value} ({percentage}%)</span>
              </div>
            );
          })}
        </div>
      </div>
      <Button variant="outline" className="mt-6 w-full rounded-2xl bg-white dark:bg-slate-950/40" onClick={() => navigate('/provider/listings')}>
        Manage Listings <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </MotionDiv>
  );
};

const TasksCard = ({ tasks }: { tasks: Array<{ title: string; description: string; icon: React.ElementType; tone: StatTone; action: () => void }> }) => (
  <MotionDiv variants={itemVariants} transition={{ duration: 0.45 }} className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-900/80">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">Tasks</h2>
    </div>
    {tasks.length > 0 ? (
      <div className="mt-5 space-y-3">
        {tasks.map(task => {
          const Icon = task.icon;
          return (
            <button key={task.title} type="button" onClick={task.action} className="group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${toneStyles[task.tone].icon}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-950 dark:text-slate-50">{task.title}</span>
                <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{task.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </button>
          );
        })}
      </div>
    ) : (
      <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-center dark:border-slate-700/70 dark:bg-slate-950/40">
        <ListChecks className="mx-auto h-9 w-9 text-emerald-500" />
        <h3 className="mt-3 text-sm font-black text-slate-950 dark:text-slate-50">No urgent tasks</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">Your listing catalog has no draft, rejected, or pending action items.</p>
      </div>
    )}
  </MotionDiv>
);

const RecentListingCard = ({ listing }: { listing: ListingResponse }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/provider/listings/${listing.id}/edit`)}
      className="group min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:shadow-slate-950/40"
    >
      <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {listing.coverImageUrl ? (
          <img src={listing.coverImageUrl} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Layers className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge kind="listing" status={listing.status} />
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">{formatCategory(listing.category)}</p>
        <h3 className="mt-1 line-clamp-1 text-base font-black text-slate-950 dark:text-slate-50">{listing.title}</h3>
        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-500 dark:text-slate-400">{listing.city || listing.country}</span>
          {listing.averageRating ? (
            <span className="inline-flex items-center gap-1 font-black text-slate-800 dark:text-slate-200">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {listing.averageRating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm font-black text-slate-950 dark:text-slate-50">{formatMoney(listing.basePrice, listing.currency)}</p>
      </div>
    </button>
  );
};
