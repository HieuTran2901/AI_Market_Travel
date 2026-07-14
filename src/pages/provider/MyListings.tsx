import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileText,
  Lightbulb,
  MapPin,
  PlusCircle,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StateBlock } from '@/components/ui/StateBlock';
import { cn } from '@/lib/utils';
import { listingService } from '@/services/listingService';
import type { ListingResponse, ListingStatus } from '@/types/listing';

type StatusChip = 'ALL' | 'ACTIVE' | 'DRAFT' | 'INACTIVE_ARCHIVED';
type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc';

const statusLabels: Record<ListingStatus, string> = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending',
  REJECTED: 'Rejected',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
  SUSPENDED: 'Suspended',
};

const categoryLabels: Record<string, string> = {
  HOTEL: 'Hotel',
  TOUR: 'Tour',
  RESTAURANT: 'Restaurant',
  VEHICLE: 'Vehicle',
  EXPERIENCE: 'Experience',
};

const statusBadgeStyles: Record<ListingStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25',
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:ring-slate-600',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25',
  INACTIVE: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/25',
  ARCHIVED: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/25',
  SUSPENDED: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25',
};

const formatMoney = (value: number, currency = 'VND') =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)} ${currency}`;

const getLocation = (listing: ListingResponse) =>
  [listing.city, listing.country].filter(Boolean).join(', ');

const isInactiveLike = (status: ListingStatus) =>
  status === 'INACTIVE' || status === 'ARCHIVED' || status === 'SUSPENDED';

const getListingDate = (listing: ListingResponse, oldest = false) => {
  const raw = oldest ? listing.createdAt : listing.updatedAt || listing.createdAt;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const StatusPill = ({ status }: { status: ListingStatus }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1', statusBadgeStyles[status])}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {statusLabels[status] ?? status}
  </span>
);

const KpiCard = ({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  helper: string;
  tone: string;
}) => (
  <Card className="group w-full min-w-0 rounded-[20px] border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.075)] dark:border-slate-700/60 dark:bg-slate-900/90">
    <CardContent className="flex items-center gap-4 p-5">
      <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-200 group-hover:scale-105', tone)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 break-words text-2xl font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">{value}</p>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</p>
      </div>
    </CardContent>
  </Card>
);

const SelectControl = ({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  label: string;
}) => (
  <label className="min-w-0">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      {children}
    </select>
  </label>
);

const ListingImage = ({ listing, className }: { listing: ListingResponse; className?: string }) => (
  <div className={cn('overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800', className)}>
    {listing.coverImageUrl ? (
      <img className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" src={listing.coverImageUrl} alt={listing.title} />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-500">No image</div>
    )}
  </div>
);

export const MyListings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [locationFilter, setLocationFilter] = React.useState('ALL');
  const [statusChip, setStatusChip] = React.useState<StatusChip>('ALL');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');

  const { data, isLoading } = useQuery({
    queryKey: ['my-listings', page],
    queryFn: () => listingService.getMyListings({ page, size: 10 }),
  });

  const listings = React.useMemo(() => data?.data?.content ?? [], [data?.data?.content]);
  const totalFromApi = data?.data?.totalElements ?? listings.length;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => listingService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      deleteMutation.mutate(id);
    }
  };

  const categoryOptions = React.useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.category))).sort(),
    [listings],
  );

  const statusOptions = React.useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.status))).sort(),
    [listings],
  );

  const locationOptions = React.useMemo(
    () => Array.from(new Set(listings.map(getLocation).filter(Boolean))).sort(),
    [listings],
  );

  const counts = React.useMemo(() => {
    const active = listings.filter((listing) => listing.status === 'ACTIVE').length;
    const draft = listings.filter((listing) => listing.status === 'DRAFT').length;
    const inactiveArchived = listings.filter((listing) => isInactiveLike(listing.status)).length;

    return {
      total: totalFromApi,
      loaded: listings.length,
      active,
      draft,
      inactiveArchived,
    };
  }, [listings, totalFromApi]);

  const avgPrice = React.useMemo(() => {
    const activePricedListings = listings.filter((listing) => listing.status === 'ACTIVE' && listing.basePrice > 0);
    const source = activePricedListings.length > 0 ? activePricedListings : listings.filter((listing) => listing.basePrice > 0);
    if (source.length === 0) return 0;
    return Math.round(source.reduce((sum, listing) => sum + listing.basePrice, 0) / source.length);
  }, [listings]);

  const currency = listings.find((listing) => listing.currency)?.currency ?? 'VND';
  const heroImageUrl = listings.find((listing) => listing.coverImageUrl)?.coverImageUrl;
  const healthPercent = counts.loaded > 0 ? Math.round((counts.active / counts.loaded) * 100) : 0;

  const filteredListings = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return listings
      .filter((listing) => {
        const matchesSearch =
          !query ||
          [listing.title, listing.city, listing.country, listing.category]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
        const matchesCategory = categoryFilter === 'ALL' || listing.category === categoryFilter;
        const matchesStatus = statusFilter === 'ALL' || listing.status === statusFilter;
        const matchesLocation = locationFilter === 'ALL' || getLocation(listing) === locationFilter;
        const matchesChip =
          statusChip === 'ALL' ||
          (statusChip === 'INACTIVE_ARCHIVED'
            ? isInactiveLike(listing.status)
            : listing.status === statusChip);

        return matchesSearch && matchesCategory && matchesStatus && matchesLocation && matchesChip;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return getListingDate(a, true) - getListingDate(b, true);
          case 'price_asc':
            return a.basePrice - b.basePrice;
          case 'price_desc':
            return b.basePrice - a.basePrice;
          case 'name_asc':
            return a.title.localeCompare(b.title);
          case 'newest':
          default:
            return getListingDate(b) - getListingDate(a);
        }
      });
  }, [categoryFilter, listings, locationFilter, searchTerm, sortBy, statusChip, statusFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setLocationFilter('ALL');
    setStatusChip('ALL');
  };

  const exportCsv = () => {
    const rows = filteredListings.map((listing) => ({
      Title: listing.title,
      Category: categoryLabels[listing.category] ?? listing.category,
      City: listing.city,
      Country: listing.country,
      Price: listing.basePrice,
      Currency: listing.currency,
      Status: statusLabels[listing.status] ?? listing.status,
    }));

    const headers = Object.keys(rows[0] ?? { Title: '', Category: '', City: '', Country: '', Price: '', Currency: '', Status: '' });
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header as keyof typeof row] ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'provider-listings.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const activities = React.useMemo(() => {
    return listings
      .filter((listing) => ['DRAFT', 'REJECTED', 'PENDING_REVIEW', 'ACTIVE'].includes(listing.status))
      .slice(0, 4)
      .map((listing) => {
        if (listing.status === 'DRAFT') return { dot: 'bg-amber-500', title: listing.title, description: 'Draft needs completion' };
        if (listing.status === 'REJECTED') return { dot: 'bg-rose-500', title: listing.title, description: listing.rejectionReason || 'Requires provider review' };
        if (listing.status === 'PENDING_REVIEW') return { dot: 'bg-blue-500', title: listing.title, description: 'Listing pending marketplace review' };
        return { dot: 'bg-emerald-500', title: listing.title, description: 'Active in your catalog' };
      });
  }, [listings]);

  const snapshotMetrics = React.useMemo(() => {
    const views = listings.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
    const reviews = listings.reduce((sum, listing) => sum + (listing.reviewCount || 0), 0);
    return [
      views > 0 ? { label: 'Views', value: views.toLocaleString() } : null,
      reviews > 0 ? { label: 'Reviews', value: reviews.toLocaleString() } : null,
      counts.active > 0 ? { label: 'Active', value: counts.active.toLocaleString() } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [counts.active, listings]);

  const chipItems: Array<{ key: StatusChip; label: string; count: number }> = [
    { key: 'ALL', label: 'All', count: counts.loaded },
    { key: 'ACTIVE', label: 'Active', count: counts.active },
    { key: 'DRAFT', label: 'Draft', count: counts.draft },
    { key: 'INACTIVE_ARCHIVED', label: 'Inactive / Archived', count: counts.inactiveArchived },
  ];

  return (
    <div data-provider-listings-root className="w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-sky-50 to-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-blue-400/15 dark:from-slate-900 dark:via-[#0b1b31] dark:to-slate-950 sm:p-8">
        {heroImageUrl ? (
          <div className="absolute inset-y-0 right-0 hidden w-[52%] overflow-hidden sm:block">
            <img
              src={heroImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-50/85 to-blue-50/15 dark:from-slate-900 dark:via-slate-900/82 dark:to-slate-950/25" />
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-blue-50 to-transparent dark:from-slate-900" />
          </div>
        ) : (
          <div className="absolute inset-y-0 right-0 hidden w-[52%] overflow-hidden sm:block">
            <div className="h-full w-full bg-[radial-gradient(circle_at_70%_35%,rgba(56,189,248,0.30),transparent_26%),radial-gradient(circle_at_82%_64%,rgba(37,99,235,0.22),transparent_28%),linear-gradient(135deg,rgba(219,234,254,0.65),rgba(255,255,255,0.2))] dark:bg-[radial-gradient(circle_at_70%_35%,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_82%_64%,rgba(37,99,235,0.24),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.3),rgba(15,23,42,0.85))]" />
          </div>
        )}
        <div className="pointer-events-none absolute -right-12 top-0 hidden h-full w-2/5 skew-x-[-18deg] bg-white/30 blur-sm dark:bg-blue-400/5 lg:block" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Provider</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              My Listings
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Manage marketplace listings, review status, and keep your catalog ready for bookings.
            </p>
          </div>

          <Button
            onClick={() => navigate('/provider/listings/new')}
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.30)] transition-all hover:-translate-y-0.5 hover:from-blue-500 hover:to-cyan-500 sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Listing
          </Button>
        </div>

        {heroImageUrl && (
          <div className="relative z-10 mt-6 overflow-hidden rounded-3xl border border-white/60 shadow-sm sm:hidden dark:border-white/10">
            <img src={heroImageUrl} alt="" className="h-28 w-full object-cover" />
          </div>
        )}
      </section>

      <div className="relative z-10 grid w-full min-w-0 max-w-full gap-4 sm:grid-cols-2 min-[1800px]:grid-cols-4">
        <KpiCard icon={FileText} label="Total Listings" value={counts.total.toLocaleString()} helper="All your properties" tone="bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/25" />
        <KpiCard icon={CheckCircle2} label="Active Listings" value={counts.active.toLocaleString()} helper={counts.loaded > 0 ? `${healthPercent}% of loaded listings` : 'Ready for bookings'} tone="bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25" />
        <KpiCard icon={Edit} label="Draft Listings" value={counts.draft.toLocaleString()} helper="Pending completion" tone="bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25" />
        <KpiCard icon={Tag} label="Avg. Nightly Price" value={avgPrice > 0 ? formatMoney(avgPrice, currency) : '-'} helper="Across active listings" tone="bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/25" />
      </div>

      <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-5 min-[1800px]:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 rounded-[20px] border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.045)] dark:border-slate-700/60 dark:bg-slate-900/90">
          <CardContent className="space-y-4 p-4">
            <div className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)] min-[1500px]:grid-cols-[minmax(260px,1.6fr)_minmax(150px,0.8fr)_minmax(170px,0.9fr)_minmax(180px,0.9fr)_auto]">
              <label className="relative w-full min-w-0 md:col-span-2 xl:col-span-1">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search listings by name or location..."
                  className="h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-ellipsis placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              <SelectControl label="Category" value={categoryFilter} onChange={setCategoryFilter}>
                <option value="ALL">Category</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{categoryLabels[category] ?? category}</option>
                ))}
              </SelectControl>

              <SelectControl label="Status" value={statusFilter} onChange={setStatusFilter}>
                <option value="ALL">Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{statusLabels[status] ?? status}</option>
                ))}
              </SelectControl>

              <SelectControl label="Location" value={locationFilter} onChange={setLocationFilter}>
                <option value="ALL">All Locations</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </SelectControl>

              <Button variant="ghost" className="h-11 shrink-0 whitespace-nowrap rounded-2xl px-3 text-blue-600 dark:text-blue-300" onClick={resetFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear all
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {chipItems.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setStatusChip(chip.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200',
                    statusChip === chip.key
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300',
                  )}
                >
                  {chip.key !== 'ALL' && <span className={cn('h-2 w-2 rounded-full', chip.key === 'ACTIVE' ? 'bg-emerald-500' : chip.key === 'DRAFT' ? 'bg-amber-500' : 'bg-slate-400')} />}
                  {chip.label} ({chip.count})
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-[20px] border-blue-100 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.045)] dark:border-blue-500/20 dark:bg-slate-900/90">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/25">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-slate-50">Listing Health</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Great! {counts.active} of {counts.loaded} listings are active.</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${healthPercent}%` }} />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{healthPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-6 min-[1800px]:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.055)] dark:border-slate-700/60 dark:bg-slate-900/90">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700/60 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Listings</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{filteredListings.length} results</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="outline" size="sm" className="h-10 rounded-2xl" onClick={exportCsv} disabled={filteredListings.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="hidden max-w-full overflow-x-hidden md:block">
              <table className="w-full table-fixed divide-y divide-slate-200 dark:divide-slate-700/60">
                <colgroup>
                  <col className="w-[42%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="bg-slate-50/80 dark:bg-slate-800/70">
                  <tr>
                    {['Listing', 'Category', 'Price', 'Status', 'Actions'].map((heading) => (
                      <th key={heading} scope="col" className={cn('px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400', heading === 'Actions' && 'text-right')}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700/50 dark:bg-slate-900/90">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8">
                        <div className="space-y-3">
                          {[1, 2, 3].map((row) => <div key={row} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
                        </div>
                      </td>
                    </tr>
                  ) : filteredListings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10">
                        <StateBlock
                          title={listings.length === 0 ? 'No listings yet' : 'No listings match your filters'}
                          description={listings.length === 0 ? 'Create your first listing to start accepting marketplace bookings.' : 'Try clearing filters or searching for another location.'}
                          actionLabel={listings.length === 0 ? 'Create Listing' : 'Clear Filters'}
                          onAction={listings.length === 0 ? () => navigate('/provider/listings/new') : resetFilters}
                          className="border-0 shadow-none"
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredListings.map((listing) => (
                      <tr key={listing.id} className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="min-w-0 px-4 py-4">
                          <div className="flex min-w-0 items-center gap-4">
                            <ListingImage listing={listing} className="h-16 w-20 shrink-0 rounded-xl" />
                            <div className="min-w-0 flex-1">
                              <div className="line-clamp-2 break-words text-sm font-bold leading-snug text-slate-950 dark:text-slate-100">{listing.title}</div>
                              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{getLocation(listing) || 'Location not set'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            {categoryLabels[listing.category] ?? listing.category}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="text-sm font-bold text-slate-950 dark:text-slate-100">{formatMoney(listing.basePrice, listing.currency)}</div>
                          <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">per night</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <StatusPill status={listing.status} />
                          {listing.status === 'REJECTED' && listing.rejectionReason && (
                            <div className="mt-1 max-w-[170px] truncate text-xs text-rose-500" title={listing.rejectionReason}>{listing.rejectionReason}</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="icon" title="View Public Page" onClick={() => window.open(`/listings/${listing.slug}`, '_blank')} className="h-9 w-9 rounded-xl">
                              <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/provider/listings/${listing.id}/edit`)} className="h-9 w-9 rounded-xl">
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(listing.id)} disabled={deleteMutation.isPending} className="h-9 w-9 rounded-xl">
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {isLoading ? (
                [1, 2, 3].map((row) => <div key={row} className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />)
              ) : filteredListings.length === 0 ? (
                <StateBlock
                  title={listings.length === 0 ? 'No listings yet' : 'No listings match your filters'}
                  description={listings.length === 0 ? 'Create your first listing to start accepting marketplace bookings.' : 'Try clearing filters or searching for another location.'}
                  actionLabel={listings.length === 0 ? 'Create Listing' : 'Clear Filters'}
                  onAction={listings.length === 0 ? () => navigate('/provider/listings/new') : resetFilters}
                  className="border-0 shadow-none"
                />
              ) : (
                filteredListings.map((listing) => (
                  <div key={listing.id} className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
                    <div className="flex gap-4">
                      <ListingImage listing={listing} className="h-24 w-28 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold text-slate-950 dark:text-slate-100">{listing.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                          {getLocation(listing) || 'Location not set'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                            {categoryLabels[listing.category] ?? listing.category}
                          </span>
                          <StatusPill status={listing.status} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700/60">
                      <div>
                        <p className="text-sm font-bold text-slate-950 dark:text-slate-100">{formatMoney(listing.basePrice, listing.currency)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">per night</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="View Public Page" onClick={() => window.open(`/listings/${listing.slug}`, '_blank')} className="h-9 w-9 rounded-xl">
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/provider/listings/${listing.id}/edit`)} className="h-9 w-9 rounded-xl">
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(listing.id)} disabled={deleteMutation.isPending} className="h-9 w-9 rounded-xl">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {data?.data && data.data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-700/60">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                  Previous
                </Button>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Page {page + 1} of {data.data.totalPages}</span>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((current) => Math.min(data.data.totalPages - 1, current + 1))} disabled={page >= data.data.totalPages - 1}>
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="grid min-w-0 gap-5 lg:grid-cols-2 2xl:grid-cols-3 min-[1800px]:grid-cols-1">
          <Card className="rounded-[20px] border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.045)] dark:border-slate-700/60 dark:bg-slate-900/90">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">Recent Activity</h2>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">Live catalog</span>
              </div>
              {activities.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {activities.map((activity, index) => (
                    <div key={`${activity.title}-${index}`} className="flex gap-3">
                      <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', activity.dot)} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{activity.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">No recent listing activity available yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-blue-100 bg-blue-50/40 shadow-[0_10px_30px_rgba(15,23,42,0.045)] dark:border-blue-500/20 dark:bg-blue-500/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">Listing Tips</h2>
              </div>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-white/75 p-4 dark:border-blue-500/20 dark:bg-slate-900/70">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Increase your visibility</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Listings with complete photos, amenities, and accurate pricing are easier for travelers to compare.</p>
                <button type="button" onClick={() => navigate('/provider/listings/new')} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300">
                  Add more details <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.045)] dark:border-slate-700/60 dark:bg-slate-900/90">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">Performance Snapshot</h2>
              </div>
              {snapshotMetrics.length > 0 ? (
                <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60">
                  {snapshotMetrics.map((metric) => (
                    <div key={metric.label} className="border-r border-slate-200 p-3 last:border-r-0 dark:border-slate-700/60">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
                      <p className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-50">{metric.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">No performance metrics available yet.</p>
              )}
              <button type="button" onClick={() => navigate('/provider/analytics')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300">
                View full analytics <ArrowRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};
