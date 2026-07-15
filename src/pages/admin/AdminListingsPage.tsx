import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MotionConfig, motion } from 'framer-motion';
import {
  Ban,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  CreditCard,
  Download,
  Eye,
  FileBarChart,
  FileClock,
  Filter,
  Gavel,
  HeartHandshake,
  ImagePlus,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { AdminSidebarCollapseButton } from '@/components/admin/AdminSidebarCollapseButton';
import { AdminSidebarSectionLabel, AdminSidebarText } from '@/components/admin/AdminSidebarAnimatedText';
import { useAdminSidebarCollapse } from '@/components/admin/useAdminSidebarCollapse';
import { ThemeMenu, ThemeToggle } from '@/components/theme/ThemeControls';
import { adminListingService } from '@/services/adminListingService';
import { PageResponse } from '@/types';
import {
  AdminListing,
  AdminListingPerformance,
  AdminListingSearchParams,
  AdminListingStatistics,
  AdminListingTopProvider,
} from '@/types/adminListing';

type NavItem = {
  label: string;
  icon: React.ElementType;
  to?: string;
  group?: 'main' | 'management' | 'operations' | 'system';
};

type ListingFilterState = {
  search: string;
  category: string;
  status: string;
  location: string;
  dateRange: string;
  pageSize: string;
  tab: string;
  page: string;
};

type ListingModerationAction = 'approve' | 'reject' | 'suspend' | 'reactivate';

type ModerationDialogState = {
  action: Extract<ListingModerationAction, 'approve' | 'reject'>;
  listing: AdminListing;
  row: ReturnType<typeof normalizeListingRow>;
} | null;

type ListingColumnKey = 'provider' | 'category' | 'status' | 'price' | 'rating' | 'updatedAt' | 'bookings';

const listingColumnOptions: Array<{ key: ListingColumnKey; label: string }> = [
  { key: 'provider', label: 'Provider' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'price', label: 'Price' },
  { key: 'rating', label: 'Rating' },
  { key: 'updatedAt', label: 'Last Updated' },
  { key: 'bookings', label: 'Bookings' },
];

const defaultListingColumns = listingColumnOptions.reduce<Record<ListingColumnKey, boolean>>((columns, option) => {
  columns[option.key] = true;
  return columns;
}, {} as Record<ListingColumnKey, boolean>);

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard', group: 'main' },
  { label: 'Users', icon: Users, to: '/admin/users', group: 'management' },
  { label: 'Providers', icon: HeartHandshake, to: '/admin/providers', group: 'management' },
  { label: 'Listings', icon: Store, to: '/admin/listings', group: 'management' },
  { label: 'Bookings', icon: CalendarCheck, group: 'management' },
  { label: 'Reviews', icon: Star, group: 'management' },
  { label: 'Payments', icon: CreditCard, group: 'operations' },
  { label: 'Settlements', icon: ListChecks, group: 'operations' },
  { label: 'Reports', icon: FileBarChart, group: 'operations' },
  { label: 'Disputes', icon: Gavel, group: 'operations' },
  { label: 'Settings', icon: Settings, group: 'system' },
  { label: 'Roles & Permissions', icon: UserCog, group: 'system' },
  { label: 'System Logs', icon: FileClock, group: 'system' },
];

const groupedNav = [
  { label: null, items: adminNavItems.filter(item => item.group === 'main') },
  { label: 'Management', items: adminNavItems.filter(item => item.group === 'management') },
  { label: 'Operations', items: adminNavItems.filter(item => item.group === 'operations') },
  { label: 'System', items: adminNavItems.filter(item => item.group === 'system') },
];

const initialFilters: ListingFilterState = {
  search: '',
  category: 'all',
  status: 'all',
  location: 'all',
  dateRange: '',
  pageSize: '10',
  tab: 'all',
  page: '0',
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const pageSequence = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
};

const quickTransition = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const };
const MotionDiv = motion.div;
const MotionSection = motion.section;
const MotionArticle = motion.article;
const MotionTbody = motion.tbody;
const MotionTr = motion.tr;

function safeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function labelize(value?: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'Unknown';
  return value.trim().toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function normalizeEnum(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : 'UNKNOWN';
}

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeCount(value: unknown) {
  const number = safeNumber(value);
  return number === null ? 0 : number;
}

function formatListingPrice(value: unknown, currency?: string | null) {
  const amount = safeNumber(value);
  const safeCurrency = safeText(currency) || 'VND';
  if (amount === null) return '-';
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: safeCurrency, maximumFractionDigits: safeCurrency === 'VND' ? 0 : 2 }).format(amount);
  } catch {
    return `${amount.toLocaleString('vi-VN')} ${safeCurrency}`;
  }
}

function formatSafeDate(value: unknown, includeTime = true) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  const options: Intl.DateTimeFormatOptions = includeTime
    ? { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function initials(name?: unknown) {
  const text = safeText(name);
  if (!text) return 'L';
  return text.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function formatNumber(value?: unknown) {
  const number = safeNumber(value);
  return number === null ? '-' : number.toLocaleString();
}

function relativeTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, amount] of divisions) {
    if (Math.abs(seconds) >= amount) return formatter.format(Math.round(seconds / amount), unit);
  }
  return 'just now';
}

function parseDateRange(value: string) {
  const [fromRaw, toRaw] = value.split(/\s+to\s+|\s+-\s+/i).map(part => part?.trim()).filter(Boolean);
  const toIso = (date: string | undefined, endOfDay = false) => {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return undefined;
    parsed.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return parsed.toISOString();
  };
  return { updatedFrom: toIso(fromRaw), updatedTo: toIso(toRaw ?? fromRaw, true) };
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

function getInitialFilters(searchParams: URLSearchParams): ListingFilterState {
  return {
    search: searchParams.get('keyword') ?? '',
    category: searchParams.get('category') ?? 'all',
    status: searchParams.get('status') ?? 'all',
    location: searchParams.get('location') ?? 'all',
    dateRange: searchParams.get('dateRange') ?? '',
    pageSize: searchParams.get('size') ?? '10',
    tab: searchParams.get('tab') ?? 'all',
    page: searchParams.get('page') ?? '0',
  };
}

function toApiParams(filters: ListingFilterState, debouncedSearch: string): AdminListingSearchParams {
  const range = parseDateRange(filters.dateRange);
  const tabCategory = filters.tab !== 'all' ? filters.tab.toUpperCase() : undefined;
  return {
    page: Math.max(Number(filters.page) || 0, 0),
    size: Math.min(Math.max(Number(filters.pageSize) || 10, 1), 100),
    sort: 'updatedAt,desc',
    keyword: debouncedSearch.trim() || undefined,
    category: filters.category !== 'all' ? filters.category.toUpperCase() : tabCategory,
    status: filters.status !== 'all' ? filters.status.toUpperCase() : undefined,
    location: filters.location !== 'all' ? filters.location : undefined,
    ...range,
  };
}

function countActiveFilters(filters: ListingFilterState) {
  return [
    filters.search.trim(),
    filters.category !== 'all',
    filters.status !== 'all',
    filters.location !== 'all',
    filters.dateRange,
  ].filter(Boolean).length;
}

function getApiErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeResponse = error as { message?: unknown; error?: unknown; response?: { data?: { message?: unknown; error?: unknown } } };
    const responseMessage = maybeResponse.response?.data?.message ?? maybeResponse.response?.data?.error;
    const directMessage = maybeResponse.message ?? maybeResponse.error;
    if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;
    if (typeof directMessage === 'string' && directMessage.trim()) return directMessage;
  }
  return 'Unable to update listing status.';
}

export const AdminListingsPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = React.useState(false);
  const [columnsPanelOpen, setColumnsPanelOpen] = React.useState(false);
  const { collapsed: sidebarCollapsed, compact: sidebarCompact, labelsHidden: sidebarLabelsHidden, transitioning: sidebarTransitioning, toggle: toggleSidebarCollapsed } = useAdminSidebarCollapse();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState<ListingFilterState>(() => getInitialFilters(searchParams));
  const [draftFilters, setDraftFilters] = React.useState<ListingFilterState>(() => getInitialFilters(searchParams));
  const [visibleColumns, setVisibleColumns] = React.useState<Record<ListingColumnKey, boolean>>(() => {
    try {
      const saved = window.localStorage.getItem('admin-listings-visible-columns');
      return saved ? { ...defaultListingColumns, ...JSON.parse(saved) } : defaultListingColumns;
    } catch {
      return defaultListingColumns;
    }
  });
  const [mutationMessage, setMutationMessage] = React.useState<string | null>(null);
  const [moderationDialog, setModerationDialog] = React.useState<ModerationDialogState>(null);
  const [rejectReasonCode, setRejectReasonCode] = React.useState('Incomplete information');
  const [rejectNotes, setRejectNotes] = React.useState('');
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const profileRef = React.useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adminName = user?.fullName || user?.email || 'Administrator';
  const debouncedSearch = useDebouncedValue(filters.search, 380);
  const apiParams = React.useMemo(() => toApiParams(filters, debouncedSearch), [filters, debouncedSearch]);
  const activeFilters = countActiveFilters(filters);

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (filters.search.trim()) next.set('keyword', filters.search.trim());
    if (filters.category !== 'all') next.set('category', filters.category);
    if (filters.status !== 'all') next.set('status', filters.status);
    if (filters.location !== 'all') next.set('location', filters.location);
    if (filters.dateRange) next.set('dateRange', filters.dateRange);
    if (filters.pageSize !== '10') next.set('size', filters.pageSize);
    if (filters.tab !== 'all') next.set('tab', filters.tab);
    if (filters.page !== '0') next.set('page', filters.page);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem('admin-listings-visible-columns', JSON.stringify(visibleColumns));
    } catch {
      // Column preferences are nice-to-have; ignore storage failures.
    }
  }, [visibleColumns]);

  const listingsQuery = useQuery({
    queryKey: ['admin-listings', apiParams],
    queryFn: () => adminListingService.getListings(apiParams),
  });
  const statisticsQuery = useQuery({ queryKey: ['admin-listing-statistics'], queryFn: () => adminListingService.getStatistics() });
  const performanceQuery = useQuery({ queryKey: ['admin-listing-performance', '30d'], queryFn: () => adminListingService.getPerformance('30d') });
  const topProvidersQuery = useQuery({ queryKey: ['admin-listing-top-providers'], queryFn: () => adminListingService.getTopProviders(5) });
  const recentQuery = useQuery({ queryKey: ['admin-listing-recent-submissions'], queryFn: () => adminListingService.getRecentSubmissions(5) });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: ListingModerationAction; reason?: string }) => {
      if (action === 'approve') return adminListingService.approve(id);
      if (action === 'reactivate') return adminListingService.reactivate(id);
      if (action === 'reject') return adminListingService.reject(id, reason ?? '');
      return adminListingService.suspend(id, reason ?? 'Suspended from admin listings management.');
    },
    onSuccess: response => {
      setMutationMessage(response.message || 'Listing updated.');
      setModerationDialog(null);
      setDialogError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-listing-statistics'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-listing-recent-submissions'] });
      window.setTimeout(() => setMutationMessage(null), 2200);
    },
    onError: error => {
      const message = getApiErrorMessage(error);
      setDialogError(message);
      setMutationMessage(message);
      window.setTimeout(() => setMutationMessage(null), 2600);
    },
  });

  const page = listingsQuery.data?.data;
  const listings = page?.content ?? [];
  const statistics = statisticsQuery.data?.data;
  const performance = performanceQuery.data?.data;
  const topProviders = topProvidersQuery.data?.data ?? [];
  const recent = recentQuery.data?.data ?? [];
  void performance;
  void topProviders;
  void recent;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFilterChange = <K extends keyof ListingFilterState>(key: K, value: ListingFilterState[K]) => {
    setFilters(current => ({ ...current, [key]: value, page: key === 'page' ? String(value) : '0' }));
  };

  const clearFilters = () => setFilters({ ...initialFilters, pageSize: filters.pageSize });
  void clearFilters;
  const openFiltersPanel = () => {
    setDraftFilters(filters);
    setFiltersPanelOpen(true);
  };
  const applyFiltersPanel = () => {
    setFilters({ ...draftFilters, page: '0' });
    setFiltersPanelOpen(false);
  };
  const clearPanelFilters = () => {
    const cleared = { ...initialFilters, pageSize: draftFilters.pageSize };
    setDraftFilters(cleared);
    setFilters(cleared);
    setFiltersPanelOpen(false);
  };
  const toggleColumn = (key: ListingColumnKey) => {
    setVisibleColumns(current => ({ ...current, [key]: !current[key] }));
  };
  const resetColumns = () => setVisibleColumns(defaultListingColumns);
  const refreshAll = () => {
    void listingsQuery.refetch();
    void statisticsQuery.refetch();
    void performanceQuery.refetch();
    void topProvidersQuery.refetch();
    void recentQuery.refetch();
  };
  void refreshAll;

  const closeModerationDialog = () => {
    if (actionMutation.isPending) return;
    setModerationDialog(null);
    setDialogError(null);
  };

  const handleListingAction = (listing: AdminListing, action: ListingModerationAction) => {
    if (actionMutation.isPending) return;
    const row = normalizeListingRow(listing);
    if (row.id === null) {
      setMutationMessage('This listing cannot be moderated because it is missing an id.');
      window.setTimeout(() => setMutationMessage(null), 2600);
      return;
    }
    if (action === 'approve' || action === 'reject') {
      setModerationDialog({ action, listing, row });
      setRejectReasonCode('Incomplete information');
      setRejectNotes('');
      setDialogError(null);
      return;
    }
    actionMutation.mutate({ id: row.id, action, reason: 'Suspended from admin listings management.' });
  };

  const submitModeration = () => {
    if (!moderationDialog || moderationDialog.row.id === null || actionMutation.isPending) return;
    if (moderationDialog.action === 'reject') {
      const code = rejectReasonCode.trim();
      const notes = rejectNotes.trim();
      if (!code) {
        setDialogError('Please choose a rejection reason.');
        return;
      }
      if (code === 'Other' && !notes) {
        setDialogError('Please add detailed notes for Other.');
        return;
      }
      const reason = notes ? `${code}: ${notes}` : code;
      actionMutation.mutate({ id: moderationDialog.row.id, action: 'reject', reason });
      return;
    }
    actionMutation.mutate({ id: moderationDialog.row.id, action: 'approve' });
  };

  React.useEffect(() => {
    if (!moderationDialog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !actionMutation.isPending) closeModerationDialog();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moderationDialog, actionMutation.isPending]);

  return (
    <MotionConfig reducedMotion="user">
      <div className={`admin-theme ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
        <div className="min-h-dvh min-w-0 overflow-x-hidden bg-[#f7f9fc] text-slate-950 transition-colors duration-200 dark:bg-[#07111f] dark:text-slate-50">
          {drawerOpen && <button type="button" aria-label="Close admin navigation" className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm xl:hidden" onClick={() => setDrawerOpen(false)} />}
          <AdminSidebar drawerOpen={drawerOpen} collapsed={sidebarCompact} labelsHidden={sidebarLabelsHidden} toggleDisabled={sidebarTransitioning} toggleCollapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebarCollapsed} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
          <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCompact ? 'xl:pl-[80px]' : 'xl:pl-[240px]'}`}>
            <AdminHeader adminName={adminName} profileOpen={profileOpen} profileRef={profileRef} onToggleProfile={() => setProfileOpen(value => !value)} onMenu={() => setDrawerOpen(true)} onLogout={handleLogout} />
            <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6 2xl:px-8">
              <MotionDiv className="mx-auto w-full max-w-[1680px] min-w-0 space-y-5 pb-24" variants={pageSequence} initial="hidden" animate="visible">
                {mutationMessage && <MotionDiv variants={fadeUp} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 shadow-sm">{mutationMessage}</MotionDiv>}
                <ListingsTable filters={filters} activeFilters={activeFilters} statistics={statistics} listings={listings} page={page} loading={listingsQuery.isLoading || listingsQuery.isFetching} error={listingsQuery.isError} visibleColumns={visibleColumns} onRetry={() => void listingsQuery.refetch()} onChange={handleFilterChange} onAction={handleListingAction} onOpenFilters={openFiltersPanel} onOpenColumns={() => setColumnsPanelOpen(true)} actionLoadingId={actionMutation.variables?.id} />
                <ModerationDialog state={moderationDialog} reasonCode={rejectReasonCode} notes={rejectNotes} error={dialogError} submitting={actionMutation.isPending} onReasonCodeChange={setRejectReasonCode} onNotesChange={setRejectNotes} onClose={closeModerationDialog} onSubmit={submitModeration} />
                <ListingFiltersPanel open={filtersPanelOpen} draftFilters={draftFilters} activeFilters={countActiveFilters(draftFilters)} onDraftChange={(key, value) => setDraftFilters(current => ({ ...current, [key]: value, page: key === 'page' ? String(value) : '0' }))} onApply={applyFiltersPanel} onClear={clearPanelFilters} onClose={() => setFiltersPanelOpen(false)} />
                <ListingColumnsPanel open={columnsPanelOpen} visibleColumns={visibleColumns} onToggle={toggleColumn} onReset={resetColumns} onClose={() => setColumnsPanelOpen(false)} />
              </MotionDiv>
            </main>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};

const AdminHeader = ({ adminName, profileOpen, profileRef, onToggleProfile, onMenu, onLogout }: { adminName: string; profileOpen: boolean; profileRef: React.RefObject<HTMLDivElement>; onToggleProfile: () => void; onMenu: () => void; onLogout: () => void }) => (
  <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800 dark:bg-[#081321]/92">
    <div className="mx-auto flex h-20 w-full max-w-[1680px] min-w-0 items-center justify-between gap-5 px-4 md:px-6 2xl:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenu} className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm xl:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Menu className="h-5 w-5" /></button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight text-blue-600 md:text-2xl">Listings</h1>
          <div className="mt-1 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:flex"><Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link><ChevronRight className="h-3.5 w-3.5" /><span>Listings</span></div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3">
        <button className="hidden h-11 w-full max-w-[430px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-500 shadow-sm transition hover:border-blue-100 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-400 md:flex"><Search className="h-4 w-4 shrink-0" /><span className="truncate">Search anything...</span><span className="ml-auto shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-400 dark:bg-slate-800">Ctrl K</span></button>
        <HeaderIcon icon={Bell} label="Notifications" badge="3" />
        <HeaderIcon icon={MessageSquare} label="Messages" />
        <ThemeToggle />
        <div ref={profileRef} className="relative shrink-0">
          <button type="button" onClick={onToggleProfile} className="flex h-11 items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-blue-100 dark:border-slate-700/70 dark:bg-slate-900/80">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">DA</span>
            <span className="hidden text-left md:block"><span className="block max-w-[140px] truncate text-sm font-black text-slate-900 dark:text-slate-100">{adminName}</span><span className="block text-xs font-semibold text-slate-500">Administrator</span></span>
          </button>
          {profileOpen && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.97, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-14 z-40 w-72 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/80 dark:border-slate-700/70 dark:bg-slate-900 dark:shadow-slate-950/50"
            >
              <ThemeMenu />
              <div className="border-t border-slate-200/80 p-2 dark:border-slate-700/70">
                <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </MotionDiv>
          )}
        </div>
      </div>
    </div>
  </header>
);

const HeaderIcon = ({ icon: Icon, label, badge }: { icon: React.ElementType; label: string; badge?: string }) => (
  <button type="button" aria-label={label} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:text-blue-700 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300"><Icon className="h-5 w-5" />{badge && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">{badge}</span>}</button>
);

const AdminSidebar = ({ drawerOpen, collapsed, labelsHidden, toggleDisabled, toggleCollapsed, onToggleCollapsed, onClose, onLogout }: { drawerOpen: boolean; collapsed: boolean; labelsHidden: boolean; toggleDisabled: boolean; toggleCollapsed: boolean; onToggleCollapsed: () => void; onClose: () => void; onLogout: () => void }) => {
  const location = useLocation();
  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 transform flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-200/70 [height:100dvh] transition-[width,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-slate-800 dark:bg-[#081321] dark:shadow-slate-950/40 xl:z-40 xl:translate-x-0 xl:shadow-none ${collapsed ? 'xl:w-[80px]' : 'xl:w-[240px]'} ${drawerOpen ? 'w-[240px] translate-x-0' : 'w-[240px] -translate-x-full'}`}>
      <AdminSidebarCollapseButton collapsed={toggleCollapsed} disabled={toggleDisabled} onToggle={onToggleCollapsed} />
      <div className={`flex h-20 shrink-0 items-center justify-between transition-[padding] duration-200 ${collapsed ? 'xl:px-3' : 'px-5'}`}>
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={onClose}><img src="/brand/ai-marketplace-traveler-logo.png" alt="AI Marketplace Traveler" className={`h-12 w-auto object-contain transition-all duration-200 ${collapsed ? 'xl:max-w-[48px]' : ''}`} /></Link>
        <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 xl:hidden" onClick={onClose} aria-label="Close admin navigation"><X className="h-5 w-5" /></button>
      </div>
      <nav className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 pb-5 transition-[padding] duration-200 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 ${collapsed ? 'xl:px-3' : 'px-4'}`}>
        {groupedNav.map(group => <div key={group.label || 'main'} className="mb-5">{group.label && <AdminSidebarSectionLabel hidden={labelsHidden}>{group.label}</AdminSidebarSectionLabel>}<div className="space-y-1">{group.items.map(item => {
          const Icon = item.icon;
          const active = item.to && location.pathname === item.to;
          if (item.to) return <Link key={item.label} to={item.to} title={collapsed ? item.label : undefined} onClick={onClose} className={`group flex items-center rounded-2xl text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${collapsed ? 'xl:mx-auto xl:h-12 xl:w-12 xl:justify-center xl:p-0' : 'gap-3 px-4 py-3'} ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'}`}><Icon className="h-5 w-5 shrink-0" /><AdminSidebarText hidden={labelsHidden}>{item.label}</AdminSidebarText><ChevronRight className={`h-4 w-4 shrink-0 transition-[opacity,max-width] duration-200 ${labelsHidden ? 'max-w-0 opacity-0' : active ? 'max-w-4 opacity-100' : 'max-w-4 opacity-0 group-hover:opacity-100'}`} /></Link>;
          return <button key={item.label} type="button" disabled title={collapsed ? item.label : 'No admin route is currently wired for this feature.'} className={`flex items-center rounded-2xl text-left text-sm font-bold text-slate-400 opacity-75 ${collapsed ? 'xl:mx-auto xl:h-12 xl:w-12 xl:justify-center xl:p-0' : 'w-full gap-3 px-4 py-3'}`}><Icon className="h-5 w-5 shrink-0" /><AdminSidebarText hidden={labelsHidden}>{item.label}</AdminSidebarText></button>;
        })}</div></div>)}
      </nav>
      <div className={`shrink-0 space-y-3 border-t border-slate-200/80 bg-white p-4 transition-[padding] duration-200 dark:border-slate-800 dark:bg-[#081321] ${collapsed ? 'xl:px-3' : ''}`}>
        <Link to="/" title={collapsed ? 'View Site' : undefined} onClick={onClose} className={`flex h-12 items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 ${collapsed ? 'xl:justify-center xl:px-0' : ''}`}><AdminSidebarText hidden={labelsHidden} className="font-black">View Site</AdminSidebarText><ChevronRight className="h-4 w-4 shrink-0" /></Link>
        <button type="button" title={collapsed ? 'Sign out' : undefined} onClick={onLogout} className={`flex h-12 w-full items-center gap-3 rounded-2xl border border-red-100 bg-white px-4 text-sm font-black text-red-600 transition hover:bg-red-50 ${collapsed ? 'xl:justify-center xl:px-0' : ''}`}><LogOut className="h-4 w-4 shrink-0" /><AdminSidebarText hidden={labelsHidden} className="font-black">Sign out</AdminSidebarText></button>
      </div>
    </aside>
  );
};

const ManagementBanner = () => {
  const indicators = [
    { title: 'Reviewed', text: 'Manual & AI review', icon: ShieldCheck, tone: 'blue' },
    { title: 'High quality', text: 'Quality standards', icon: Sparkles, tone: 'cyan' },
    { title: 'Fast moderation', text: 'Quick turnaround', icon: CalendarCheck, tone: 'amber' },
    { title: 'Provider ready', text: 'Guided onboarding', icon: Users, tone: 'emerald' },
  ];
  return (
    <MotionSection variants={fadeUp} transition={quickTransition} className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(320px,1.1fr)_minmax(0,1.9fr)] lg:items-center">
        <div className="flex min-w-0 items-center gap-5 rounded-[18px] bg-blue-50/70 p-4 dark:bg-blue-500/10"><ListingIllustration /><div className="min-w-0"><h2 className="text-lg font-black text-slate-950 dark:text-slate-50">Manage marketplace listings</h2><p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">Create, review, and optimize listings to ensure quality experiences for travelers everywhere.</p></div></div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">{indicators.map(item => <TrustIndicator key={item.title} {...item} />)}</div>
      </div>
    </MotionSection>
  );
};

const ListingIllustration = () => (
  <div className="relative flex h-20 w-28 shrink-0 items-center justify-center" aria-hidden="true"><div className="absolute left-1 top-3 h-12 w-12 rounded-full bg-blue-100" /><div className="absolute right-2 top-1 h-14 w-14 rounded-full bg-cyan-100" /><div className="relative z-10 h-16 w-20 rounded-[20px] border border-blue-200 bg-white shadow-sm"><div className="mx-auto mt-3 h-8 w-12 rounded-lg bg-gradient-to-br from-sky-300 to-blue-500" /><div className="mx-auto mt-2 h-1.5 w-11 rounded-full bg-amber-100" /></div><span className="absolute bottom-1 left-1 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 ring-4 ring-white"><ImagePlus className="h-4 w-4" /></span><span className="absolute bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white"><Store className="h-4 w-4" /></span></div>
);

const TrustIndicator = ({ title, text, icon: Icon, tone }: { title: string; text: string; icon: React.ElementType; tone: string }) => {
  const tones: Record<string, string> = { blue: 'bg-blue-50 text-blue-600 ring-blue-100', cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100', amber: 'bg-amber-50 text-amber-600 ring-amber-100', emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100' };
  return <MotionDiv whileHover={{ y: -2 }} transition={{ duration: 0.16 }} className="flex min-w-0 items-center gap-3 rounded-[18px] border border-slate-100 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/30"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${tones[tone]}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{title}</p><p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{text}</p></div></MotionDiv>;
};

const statTones: Record<string, { icon: string; helper: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-600 ring-blue-100', helper: 'text-blue-700' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100', helper: 'text-emerald-700' },
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-100', helper: 'text-amber-700' },
  violet: { icon: 'bg-violet-50 text-violet-600 ring-violet-100', helper: 'text-violet-700' },
  rose: { icon: 'bg-rose-50 text-rose-600 ring-rose-100', helper: 'text-rose-700' },
};

const ListingStatsGrid = ({ statistics, loading, error, onRetry }: { statistics?: AdminListingStatistics; loading: boolean; error: boolean; onRetry: () => void }) => {
  const stats = [
    { label: 'Total Listings', value: statistics?.totalListings, helper: 'All marketplace listings', icon: Store, tone: 'blue' },
    { label: 'Active Listings', value: statistics?.activeListings, helper: 'Currently live', icon: CheckCircle2, tone: 'emerald' },
    { label: 'Pending Review', value: statistics?.pendingListings, helper: 'Awaiting approval', icon: CalendarCheck, tone: 'amber' },
    { label: 'Draft Listings', value: statistics?.draftListings, helper: 'Work in progress', icon: FileClock, tone: 'violet' },
    { label: 'Suspended Listings', value: statistics?.suspendedListings, helper: 'Temporarily disabled', icon: Ban, tone: 'rose' },
  ] as const;
  if (error) return <section className="rounded-[22px] border border-red-100 bg-red-50/70 p-5 text-sm font-bold text-red-700"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>Unable to load listing statistics.</span><button type="button" onClick={onRetry} className="h-10 rounded-2xl bg-white px-4 text-sm font-black text-red-700 shadow-sm">Retry</button></div></section>;
  return <MotionSection className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" variants={pageSequence} initial="hidden" animate="visible">{stats.map(stat => <StatCard key={stat.label} stat={stat} loading={loading} />)}</MotionSection>;
};

const StatCard = ({ stat, loading }: { stat: { label: string; value?: number; helper: string; icon: React.ElementType; tone: string }; loading: boolean }) => {
  const Icon = stat.icon;
  const tone = statTones[stat.tone];
  return <MotionArticle variants={fadeUp} transition={quickTransition} whileHover={{ y: -3 }} className="flex min-h-[132px] min-w-0 items-center gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/70 dark:border-slate-700/60 dark:bg-slate-900/80"><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 ${tone.icon}`}><Icon className="h-6 w-6" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>{loading ? <div className="mt-3 h-8 w-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /> : <p className="mt-2 truncate whitespace-nowrap text-[28px] font-black leading-tight tracking-tight text-slate-950 dark:text-slate-50">{formatNumber(stat.value)}</p>}<p className={`mt-2 line-clamp-1 text-xs font-black ${tone.helper}`}>{loading ? 'Loading...' : stat.helper}</p></div></MotionArticle>;
};

const ListingFilters = ({ filters, activeFilters, onChange, onClear }: { filters: ListingFilterState; activeFilters: number; onChange: <K extends keyof ListingFilterState>(key: K, value: ListingFilterState[K]) => void; onClear: () => void }) => (
  <MotionSection variants={fadeUp} transition={quickTransition} className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
    <div className="grid min-w-0 gap-3 lg:grid-cols-2 xl:[grid-template-columns:minmax(260px,1.5fr)_repeat(4,minmax(140px,0.65fr))_auto]">
      <label className="relative min-w-0"><span className="sr-only">Search listings</span><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={filters.search} onChange={event => onChange('search', event.target.value)} placeholder="Search by name, keyword, slug, provider, or ID..." className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200" /></label>
      <FilterSelect value={filters.category} onChange={value => onChange('category', value)} options={['All Categories', 'Hotel', 'Tour', 'Restaurant', 'Experience', 'Vehicle']} />
      <FilterSelect value={filters.status} onChange={value => onChange('status', value)} options={['All Statuses', 'Active', 'Pending Review', 'Draft', 'Suspended', 'Rejected', 'Inactive', 'Archived']} />
      <label className="min-w-0"><input value={filters.location === 'all' ? '' : filters.location} onChange={event => onChange('location', event.target.value || 'all')} placeholder="All locations" className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200" /></label>
      <label className="relative min-w-0"><Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={filters.dateRange} onChange={event => onChange('dateRange', event.target.value)} placeholder="Select date range" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200" /></label>
      <button type="button" disabled={activeFilters === 0} onClick={onClear} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-blue-300"><X className="h-4 w-4" />Clear filters</button>
    </div>
  </MotionSection>
);

const FilterSelect = ({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) => <label className="min-w-0"><select value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200">{options.map((option, index) => <option key={option} value={index === 0 ? 'all' : option.toUpperCase().replace(/\s+/g, '_')}>{option}</option>)}</select></label>;

const ListingFiltersPanel = ({ open, draftFilters, activeFilters, onDraftChange, onApply, onClear, onClose }: { open: boolean; draftFilters: ListingFilterState; activeFilters: number; onDraftChange: <K extends keyof ListingFilterState>(key: K, value: ListingFilterState[K]) => void; onApply: () => void; onClear: () => void; onClose: () => void }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 px-4 py-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="listing-filter-panel-title">
      <button type="button" aria-label="Close filter listings panel" className="absolute inset-0 cursor-default" onClick={onClose} />
      <MotionDiv initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={quickTransition} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 id="listing-filter-panel-title" className="text-lg font-black text-slate-950 dark:text-slate-50">Filter listings</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{activeFilters} active {activeFilters === 1 ? 'filter' : 'filters'}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Close filters"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <label className="relative min-w-0 sm:col-span-2"><span className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100">Keyword</span><Search className="pointer-events-none absolute bottom-4 left-3.5 h-4 w-4 text-slate-400" /><input value={draftFilters.search} onChange={event => onDraftChange('search', event.target.value)} placeholder="Name, keyword, slug, provider, or ID" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" /></label>
          <label className="min-w-0"><span className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100">Category</span><FilterSelect value={draftFilters.category} onChange={value => onDraftChange('category', value)} options={['All Categories', 'Hotel', 'Tour', 'Restaurant', 'Experience', 'Vehicle']} /></label>
          <label className="min-w-0"><span className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100">Status</span><FilterSelect value={draftFilters.status} onChange={value => onDraftChange('status', value)} options={['All Statuses', 'Active', 'Pending Review', 'Draft', 'Suspended', 'Rejected', 'Inactive', 'Archived']} /></label>
          <label className="min-w-0"><span className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100">Location</span><input value={draftFilters.location === 'all' ? '' : draftFilters.location} onChange={event => onDraftChange('location', event.target.value || 'all')} placeholder="All locations" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" /></label>
          <label className="min-w-0"><span className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100">Updated date range</span><input value={draftFilters.dateRange} onChange={event => onDraftChange('dateRange', event.target.value)} placeholder="YYYY-MM-DD to YYYY-MM-DD" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" /></label>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onClear} className="h-11 rounded-2xl px-4 text-sm font-black text-blue-600 transition hover:bg-blue-50 dark:text-blue-300">Clear all</button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">Cancel</button>
            <button type="button" onClick={onApply} className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98]">Apply filters</button>
          </div>
        </div>
      </MotionDiv>
    </div>,
    document.body,
  );
};

const ListingColumnsPanel = ({ open, visibleColumns, onToggle, onReset, onClose }: { open: boolean; visibleColumns: Record<ListingColumnKey, boolean>; onToggle: (key: ListingColumnKey) => void; onReset: () => void; onClose: () => void }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/20 px-4 py-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="listing-columns-panel-title">
      <button type="button" aria-label="Close columns panel" className="absolute inset-0 cursor-default" onClick={onClose} />
      <MotionDiv initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={quickTransition} className="relative z-10 w-full max-w-sm overflow-hidden rounded-[22px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="listing-columns-panel-title" className="text-base font-black text-slate-950 dark:text-slate-50">Table columns</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Listing and Actions always stay visible.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Close columns"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-2">
          {listingColumnOptions.map(column => (
            <label key={column.key} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <span>{column.label}</span>
              <input type="checkbox" checked={visibleColumns[column.key]} onChange={() => onToggle(column.key)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200" />
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button type="button" onClick={onReset} className="h-10 rounded-2xl px-3 text-sm font-black text-blue-600 transition hover:bg-blue-50 dark:text-blue-300">Reset</button>
          <button type="button" onClick={onClose} className="h-10 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700">Done</button>
        </div>
      </MotionDiv>
    </div>,
    document.body,
  );
};

const rejectionReasonOptions = [
  'Incomplete information',
  'Invalid or misleading content',
  'Low-quality images',
  'Pricing issue',
  'Policy violation',
  'Duplicate listing',
  'Other',
];

const ModerationDialog = ({ state, reasonCode, notes, error, submitting, onReasonCodeChange, onNotesChange, onClose, onSubmit }: { state: ModerationDialogState; reasonCode: string; notes: string; error: string | null; submitting: boolean; onReasonCodeChange: (value: string) => void; onNotesChange: (value: string) => void; onClose: () => void; onSubmit: () => void }) => {
  if (!state) return null;
  const isReject = state.action === 'reject';
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="listing-moderation-title">
      <MotionDiv initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={quickTransition} className="w-full max-w-lg overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900">
        <div className={`border-b px-6 py-5 ${isReject ? 'border-rose-100 bg-rose-50/70 dark:border-rose-400/15 dark:bg-rose-500/10' : 'border-emerald-100 bg-emerald-50/70 dark:border-emerald-400/15 dark:bg-emerald-500/10'}`}>
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isReject ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{isReject ? <X className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span>
            <div className="min-w-0">
              <h2 id="listing-moderation-title" className="text-lg font-black text-slate-950 dark:text-slate-50">{isReject ? 'Reject listing' : 'Approve listing'}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{isReject ? 'Provide a clear reason so the provider can fix and resubmit this listing.' : 'This listing will become publicly active and available to travelers.'}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/40">
            <p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">{state.row.title}</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Provider: {state.row.providerName}</p>
          </div>
          {isReject && (
            <>
              <label className="block text-sm font-black text-slate-800 dark:text-slate-100">Reason
                <select value={reasonCode} disabled={submitting} onChange={event => onReasonCodeChange(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  {rejectionReasonOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="block text-sm font-black text-slate-800 dark:text-slate-100">Detailed notes {reasonCode === 'Other' && <span className="text-rose-600">*</span>}
                <textarea value={notes} disabled={submitting} onChange={event => onNotesChange(event.target.value)} placeholder="Add context for the provider..." className="mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
              </label>
            </>
          )}
          {error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button type="button" disabled={submitting} onClick={onClose} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">Cancel</button>
          <button type="button" disabled={submitting} onClick={onSubmit} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 ${isReject ? 'bg-rose-600 shadow-rose-500/20 hover:bg-rose-700' : 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700'}`}>{submitting ? 'Submitting...' : isReject ? 'Reject listing' : 'Approve listing'}</button>
        </div>
      </MotionDiv>
    </div>
  );
};

const ListingsTable = ({ filters, activeFilters, statistics, listings, page, loading, error, visibleColumns, onRetry, onChange, onAction, onOpenFilters, onOpenColumns, actionLoadingId }: { filters: ListingFilterState; activeFilters: number; statistics?: AdminListingStatistics; listings: AdminListing[]; page?: PageResponse<AdminListing>; loading: boolean; error: boolean; visibleColumns: Record<ListingColumnKey, boolean>; onRetry: () => void; onChange: <K extends keyof ListingFilterState>(key: K, value: ListingFilterState[K]) => void; onAction: (listing: AdminListing, action: ListingModerationAction) => void; onOpenFilters: () => void; onOpenColumns: () => void; actionLoadingId?: number }) => {
  const categoryCount = (category: string) => statistics?.categories?.find(item => item.category === category)?.count ?? 0;
  const tabs = [
    { key: 'all', label: 'All Listings', count: statistics?.totalListings ?? page?.totalElements ?? 0 },
    { key: 'hotel', label: 'Hotels', count: categoryCount('HOTEL') },
    { key: 'tour', label: 'Tours', count: categoryCount('TOUR') },
    { key: 'restaurant', label: 'Restaurants', count: categoryCount('RESTAURANT') },
    { key: 'experience', label: 'Experiences', count: categoryCount('EXPERIENCE') },
    { key: 'vehicle', label: 'Vehicles', count: categoryCount('VEHICLE') },
  ];
  const total = page?.totalElements ?? 0;
  const pageNumber = page?.number ?? Number(filters.page) ?? 0;
  const pageSize = page?.size ?? Number(filters.pageSize) ?? 10;
  const totalPages = page?.totalPages ?? 1;
  const start = total === 0 ? 0 : pageNumber * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + listings.length - 1, total);
  const showProviderCategory = visibleColumns.provider || visibleColumns.category;
  const showPriceRating = visibleColumns.price || visibleColumns.rating;
  const showUpdatedBookings = visibleColumns.updatedAt || visibleColumns.bookings;
  const tableColSpan = 3 + [showProviderCategory, visibleColumns.status, showPriceRating, showUpdatedBookings].filter(Boolean).length;
  return (
    <MotionSection variants={fadeUp} transition={quickTransition} className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="flex min-w-0 flex-col gap-4 border-b border-slate-200/80 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">Listings</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Manage marketplace inventory, moderation, and provider submissions.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/provider/listings/new" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition duration-150 hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.97]"><Plus className="h-4 w-4" />Add Listing</Link>
          <button type="button" disabled className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition duration-150 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Download className="h-4 w-4" />Export</button>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4 border-b border-slate-200/80 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{tabs.map(tab => <button key={tab.key} type="button" onClick={() => onChange('tab', tab.key)} className={`relative shrink-0 overflow-hidden rounded-2xl px-4 py-2 text-sm font-black transition active:scale-[0.98] ${filters.tab === tab.key ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400'}`}>{filters.tab === tab.key && <MotionDiv layoutId="admin-listings-active-tab" className="absolute inset-0 rounded-2xl bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:ring-blue-400/20" transition={{ duration: 0.2 }} />}<span className="relative z-10">{tab.label} <span className="text-xs opacity-70">({(tab.count ?? 0).toLocaleString()})</span></span></button>)}</div>
        <div className="flex flex-wrap gap-2"><ToolbarButton icon={Columns3} label="Columns" onClick={onOpenColumns} expanded={false} /><ToolbarButton icon={Filter} label="Filters" badge={activeFilters} active={activeFilters > 0} onClick={onOpenFilters} expanded={false} /><label className="min-w-[130px]"><select value={filters.pageSize} disabled={loading} onChange={event => onChange('pageSize', event.target.value)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300">{['10', '20', '50', '100'].map(size => <option key={size} value={size}>{size} / page</option>)}</select></label></div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1080px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[44px]" />
            <col className="w-[27%]" />
            {showProviderCategory && <col className="w-[22%]" />}
            {visibleColumns.status && <col className="w-[10%]" />}
            {showPriceRating && <col className="w-[17%]" />}
            {showUpdatedBookings && <col className="w-[14%]" />}
            <col className="w-[170px]" />
          </colgroup>
          <thead className="bg-slate-50/90 text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400"><tr><th className="px-4 py-4"><input type="checkbox" disabled className="h-4 w-4 rounded border-slate-300" /></th><th className="px-4 py-4">Listing</th>{showProviderCategory && <th className="px-4 py-4">Provider / Category</th>}{visibleColumns.status && <th className="px-4 py-4 text-center">Status</th>}{showPriceRating && <th className="px-4 py-4">Price / Rating</th>}{showUpdatedBookings && <th className="px-4 py-4">Updated / Bookings</th>}<th className="px-4 py-4 text-center">Actions</th></tr></thead>
          <MotionTbody key={`${loading}-${error}-${pageNumber}-${filters.tab}-${listings.map(listing => listing.id).join('-')}`} className="divide-y divide-slate-100 dark:divide-slate-800" initial={{ opacity: 0.68 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
            {loading && <ListingSkeletonRows visibleColumns={visibleColumns} />}
            {!loading && error && <tr><td colSpan={tableColSpan} className="px-5 py-12"><TableState icon={ShieldAlert} title="Unable to load listings" description="The admin listings API could not be reached." action={<button type="button" onClick={onRetry} className="mt-4 h-10 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">Retry</button>} /></td></tr>}
            {!loading && !error && listings.length === 0 && <tr><td colSpan={tableColSpan} className="px-5 py-12"><TableState icon={Store} title="No listings found" description={activeFilters > 0 ? 'Try clearing filters or broadening your search.' : 'No marketplace listings are available yet.'} /></td></tr>}
            {!loading && !error && listings.map((listing, index) => {
              const rowKey = listing.id ?? listing.slug ?? `listing-${index}`;
              return <ListingTableRow key={rowKey} listing={listing} index={index} visibleColumns={visibleColumns} onAction={onAction} actionLoading={actionLoadingId === Number(listing.id)} />;
            })}
          </MotionTbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200/80 px-5 py-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Showing {start.toLocaleString()} to {end.toLocaleString()} of {total.toLocaleString()} listings</span><div className="flex items-center gap-1"><PaginationButton icon={ChevronLeft} disabled={loading || pageNumber <= 0} onClick={() => onChange('page', String(pageNumber - 1))} />{Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => <button key={index} type="button" disabled={loading} onClick={() => onChange('page', String(index))} className={`relative h-9 min-w-9 overflow-hidden rounded-xl px-3 text-sm font-black transition active:scale-[0.97] ${index === pageNumber ? 'text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300'}`}>{index === pageNumber && <MotionDiv layoutId="admin-listings-active-page" className="absolute inset-0 rounded-xl bg-blue-600" transition={{ duration: 0.18 }} />}<span className="relative z-10">{index + 1}</span></button>)}{totalPages > 5 && <span className="px-2 text-slate-400">...</span>}<PaginationButton icon={ChevronRight} disabled={loading || pageNumber >= totalPages - 1} onClick={() => onChange('page', String(pageNumber + 1))} /></div></div>
    </MotionSection>
  );
};

const normalizeListingRow = (listing: AdminListing) => {
  const id = safeNumber(listing.id);
  const title = safeText(listing.title) || 'Untitled listing';
  const slug = safeText(listing.slug);
  const providerName =
    safeText(listing.providerName) ||
    safeText(listing.providerBusinessName) ||
    safeText(listing.provider?.businessName) ||
    safeText(listing.provider?.fullName) ||
    safeText(listing.provider?.name) ||
    'Unknown provider';
  const city = safeText(listing.city);
  const country = safeText(listing.country);
  const locationLabel = [city, country].filter(Boolean).join(', ') || safeText(listing.location) || 'Location unavailable';
  const primaryImage = listing.images?.find(image => image?.isPrimary || image?.cover) ?? listing.images?.find(Boolean);
  const thumbnail = safeText(listing.thumbnailUrl) || safeText(listing.coverImageUrl) || safeText(primaryImage?.imageUrl) || safeText(primaryImage?.url);
  const category = normalizeEnum(listing.category);
  const status = normalizeEnum(listing.status);
  const price = formatListingPrice(listing.basePrice, listing.currency);
  const priceUnit = safeText(listing.priceUnit) || 'booking';
  const rating = safeNumber(listing.averageRating ?? listing.rating);
  const reviewCount = safeCount(listing.reviewCount ?? listing.totalReviews);
  const bookingCount = safeCount(listing.bookingCount ?? listing.totalBookings);
  const updatedAt = listing.updatedAt ?? listing.lastUpdatedAt ?? listing.createdAt;
  const providerVerified = Boolean(listing.providerVerified ?? listing.provider?.verified);

  return {
    id,
    title,
    slug,
    providerName,
    locationLabel,
    thumbnail,
    category,
    status,
    price,
    priceUnit,
    rating,
    reviewCount,
    bookingCount,
    updatedAt,
    providerVerified,
  };
};

const ListingTableRow = ({ listing, index, visibleColumns, onAction, actionLoading }: { listing: AdminListing; index: number; visibleColumns: Record<ListingColumnKey, boolean>; onAction: (listing: AdminListing, action: ListingModerationAction) => void; actionLoading: boolean }) => {
  const row = normalizeListingRow(listing);
  const showProviderCategory = visibleColumns.provider || visibleColumns.category;
  const showPriceRating = visibleColumns.price || visibleColumns.rating;
  const showUpdatedBookings = visibleColumns.updatedAt || visibleColumns.bookings;
  const canUseActions = row.id !== null;
  const canApprove = canUseActions && row.status === 'PENDING_REVIEW';
  const canReject = canUseActions && row.status === 'PENDING_REVIEW';
  const canSuspend = canUseActions && row.status === 'ACTIVE';
  const canReactivate = canUseActions && (row.status === 'SUSPENDED' || row.status === 'INACTIVE');
  const canOpenListing = Boolean(row.slug);
  return (
    <MotionTr initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.18) }} className="group transition-colors hover:bg-blue-50/35 dark:hover:bg-blue-500/5">
      <td className="px-4 py-4 align-middle"><input type="checkbox" className="h-4 w-4 rounded border-slate-300" aria-label={`Select ${row.title}`} disabled={!canUseActions} /></td>
      <td className="px-4 py-4"><div className="flex min-w-0 items-center gap-3">{row.thumbnail ? <img src={row.thumbnail} alt={row.title} className="h-12 w-16 shrink-0 rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.03]" loading="lazy" /> : <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-black text-blue-700 transition-transform duration-200 group-hover:scale-[1.03]">{initials(row.title)}</span>}<div className="min-w-0"><p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">{row.title}</p><p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{row.locationLabel}</p></div></div></td>
      {showProviderCategory && <td className="px-4 py-4 align-middle"><div className="min-w-0 space-y-1.5"><p className={`${visibleColumns.provider ? '' : 'sr-only'} truncate text-sm font-black text-slate-800 dark:text-slate-200`}>{row.providerName}</p><div className="flex min-w-0 flex-wrap items-center gap-2">{visibleColumns.provider && row.providerVerified && <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" />Verified</span>}{visibleColumns.category && <CategoryBadge category={row.category} />}</div></div></td>}
      {visibleColumns.status && <td className="px-4 py-4 text-center align-middle"><StatusBadge status={row.status} /></td>}
      {showPriceRating && <td className="px-4 py-4 align-middle"><div className="min-w-0"><p className={`${visibleColumns.price ? '' : 'sr-only'} truncate text-sm font-black text-slate-800 dark:text-slate-200`}>{row.price} <span className="text-xs text-slate-400">/ {row.priceUnit}</span></p>{visibleColumns.rating && (row.rating !== null && row.reviewCount > 0 ? <p className="mt-1 inline-flex items-center gap-1 text-sm font-black text-slate-800 dark:text-slate-200"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{row.rating.toFixed(1)} <span className="text-xs text-slate-400">({row.reviewCount.toLocaleString()})</span></p> : <p className="mt-1 text-xs font-bold text-slate-400">No reviews</p>)}</div></td>}
      {showUpdatedBookings && <td className="px-4 py-4 align-middle"><div className="min-w-0 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300"><p className={`${visibleColumns.updatedAt ? '' : 'sr-only'} truncate`}>{formatSafeDate(row.updatedAt, false)}</p>{visibleColumns.bookings && <p className="truncate text-slate-500">{formatSafeDate(row.updatedAt).split(', ').slice(-1)[0]} · {row.bookingCount.toLocaleString()} {row.bookingCount === 1 ? 'booking' : 'bookings'}</p>}</div></td>}
      <td className="px-4 py-4 align-middle"><div className="flex items-center justify-center gap-1.5 whitespace-nowrap">{canOpenListing ? <Link to={`/listings/${row.slug}`} aria-label="View listing" title="View listing" className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 opacity-80 transition duration-150 hover:-translate-y-px hover:bg-blue-50 hover:text-blue-700 hover:opacity-100 active:scale-[0.97] group-hover:text-slate-600 group-hover:opacity-100"><Eye className="h-4 w-4" /></Link> : <ActionIcon icon={Eye} label="View unavailable" disabled />}{canApprove && <ModerationButton icon={CheckCircle2} label="Approve" tone="approve" disabled={actionLoading} onClick={() => onAction(listing, 'approve')} />}{canReject && <ModerationButton icon={X} label="Reject" tone="reject" disabled={actionLoading} onClick={() => onAction(listing, 'reject')} />}{canSuspend && <ActionIcon icon={Ban} label="Suspend listing" disabled={actionLoading} onClick={() => onAction(listing, 'suspend')} />}{canReactivate && <ActionIcon icon={CheckCircle2} label="Reactivate listing" disabled={actionLoading} onClick={() => onAction(listing, 'reactivate')} />}<ActionIcon icon={MoreVertical} label="More actions" disabled /></div></td>
    </MotionTr>
  );
};

const CategoryBadge = ({ category }: { category: string }) => <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20">{labelize(category)}</span>;
const StatusBadge = ({ status }: { status: string }) => {
  const styles = status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : status === 'SUSPENDED' || status === 'REJECTED' ? 'bg-rose-50 text-rose-700 ring-rose-100' : status === 'DRAFT' ? 'bg-violet-50 text-violet-700 ring-violet-100' : 'bg-amber-50 text-amber-700 ring-amber-100';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${styles}`}>{labelize(status)}</span>;
};
const ModerationButton = ({ icon: Icon, label, tone, onClick, disabled }: { icon: React.ElementType; label: string; tone: 'approve' | 'reject'; onClick: () => void; disabled?: boolean }) => <button type="button" aria-label={`${label} listing`} title={`${label} listing`} disabled={disabled} onClick={onClick} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition duration-150 hover:-translate-y-px active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 ${tone === 'approve' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 ring-rose-100 hover:bg-rose-100'}`}><Icon className="h-4 w-4" /></button>;
const ActionIcon = ({ icon: Icon, label, onClick, disabled }: { icon: React.ElementType; label: string; onClick?: () => void; disabled?: boolean }) => <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 opacity-80 transition duration-150 hover:-translate-y-px hover:bg-blue-50 hover:text-blue-700 hover:opacity-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 group-hover:text-slate-600 group-hover:opacity-100 dark:text-slate-500"><Icon className="h-4 w-4" /></button>;
const ToolbarButton = ({ icon: Icon, label, badge, active, expanded, onClick }: { icon: React.ElementType; label: string; badge?: number; active?: boolean; expanded?: boolean; onClick: () => void }) => <button type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={expanded} onClick={onClick} className={`pointer-events-auto inline-flex h-10 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-sm font-black opacity-100 shadow-sm outline-none transition duration-150 hover:-translate-y-px focus:ring-2 focus:ring-blue-100 active:scale-[0.97] ${active ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300'}`}><Icon className="h-4 w-4 text-blue-600" />{label}{!!badge && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] text-white">{badge}</span>}</button>;
const PaginationButton = ({ icon: Icon, disabled, onClick }: { icon: React.ElementType; disabled?: boolean; onClick?: () => void }) => <button type="button" disabled={disabled} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition duration-150 hover:-translate-y-px hover:border-blue-200 hover:text-blue-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-400"><Icon className="h-4 w-4" /></button>;
const ListingSkeletonRows = ({ visibleColumns }: { visibleColumns: Record<ListingColumnKey, boolean> }) => {
  const showProviderCategory = visibleColumns.provider || visibleColumns.category;
  const showPriceRating = visibleColumns.price || visibleColumns.rating;
  const showUpdatedBookings = visibleColumns.updatedAt || visibleColumns.bookings;
  return <>{Array.from({ length: 6 }).map((_, index) => <tr key={index}><td className="px-4 py-4 align-middle"><div className="h-4 w-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /></td><td className="px-4 py-4 align-middle"><div className="h-12 w-full max-w-[260px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" /></td>{showProviderCategory && <td className="px-4 py-4 align-middle"><div className="h-10 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /></td>}{visibleColumns.status && <td className="px-4 py-4 align-middle"><div className="mx-auto h-8 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" /></td>}{showPriceRating && <td className="px-4 py-4 align-middle"><div className="h-10 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /></td>}{showUpdatedBookings && <td className="px-4 py-4 align-middle"><div className="h-10 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /></td>}<td className="px-4 py-4 align-middle"><div className="mx-auto h-9 w-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /></td></tr>)}</>;
};
const TableState = ({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) => <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-[22px] border border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center dark:border-blue-400/20 dark:bg-blue-500/10"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-blue-100"><Icon className="h-7 w-7" /></span><h3 className="mt-4 text-lg font-black text-slate-950 dark:text-slate-50">{title}</h3><p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p>{action}</div>;

const ListingAnalyticsGrid = ({ statistics, performance, topProviders, recent, loading, onRetry }: { statistics?: AdminListingStatistics; performance?: AdminListingPerformance; topProviders: AdminListingTopProvider[]; recent: AdminListing[]; loading: boolean; onRetry: () => void }) => (
  <MotionSection className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]" variants={pageSequence} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }}>
    <AnalyticsCard title="Listing Performance" action={<button type="button" disabled className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-black text-slate-500 disabled:opacity-70 dark:border-slate-700 dark:text-slate-400">Last 30 days</button>}><p className="mt-4 text-[32px] font-black leading-tight text-slate-950 dark:text-slate-50">{loading ? '-' : formatNumber(performance?.totalViews)}</p><p className="mt-1 text-[13px] font-black leading-5 text-emerald-600">{loading ? 'Loading...' : `${formatNumber(performance?.totalBookings)} total bookings`}</p><div className="mt-4 flex min-h-[210px] items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center dark:border-slate-700 dark:bg-slate-950/40">{loading ? <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-100" /> : performance?.viewSeriesAvailable || performance?.bookingSeriesAvailable ? <EmptyMini icon={TrendingUp} title="Performance series ready" description="Time-series points are available for this range." /> : <EmptyMini icon={TrendingUp} title="No time-series endpoint" description="The backend exposes total views and bookings, but not dated analytics points yet." />}</div></AnalyticsCard>
    <AnalyticsCard title="Category Distribution" action={<Building2 className="h-5 w-5 text-blue-500" />}><CategoryDistribution categories={statistics?.categories ?? []} loading={loading} /></AnalyticsCard>
    <AnalyticsCard title="Top Providers"><TopProviders providers={topProviders} loading={loading} /></AnalyticsCard>
    <AnalyticsCard title="Recent Submissions"><RecentSubmissions listings={recent} loading={loading} onRetry={onRetry} /></AnalyticsCard>
  </MotionSection>
);

const AnalyticsCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => <MotionArticle variants={fadeUp} transition={quickTransition} className="min-h-[300px] w-full min-w-0 max-w-full rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80"><div className="flex min-w-0 items-center justify-between gap-3"><h3 className="min-w-0 text-lg font-semibold leading-tight tracking-tight text-slate-950 dark:text-slate-50">{title}</h3>{action && <div className="shrink-0">{action}</div>}</div>{children}</MotionArticle>;
const CategoryDistribution = ({ categories, loading }: { categories: AdminListingStatistics['categories']; loading: boolean }) => <div className="mt-5 min-w-0 max-w-full space-y-4">{loading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded-2xl bg-slate-100" />) : categories.length > 0 ? categories.map((category, index) => <div key={category.category} className="min-w-0"><div className="flex min-w-0 items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-black text-slate-700 dark:text-slate-200">{labelize(category.category)}</span><span className="shrink-0 whitespace-nowrap font-black text-slate-400">{category.count.toLocaleString()} ({Number(category.percentage).toFixed(1)}%)</span></div><div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><motion.div className={`${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-violet-500' : index === 2 ? 'bg-amber-500' : 'bg-emerald-500'} h-full rounded-full`} initial={{ width: 0 }} whileInView={{ width: `${Math.min(Number(category.percentage), 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.48, delay: index * 0.06 }} /></div></div>) : <EmptyMini icon={Building2} title="No category data" description="Category distribution will appear when listings exist." />}</div>;
const TopProviders = ({ providers, loading }: { providers: AdminListingTopProvider[]; loading: boolean }) => <div className="mt-5 space-y-3">{loading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />) : providers.length > 0 ? providers.map((provider, index) => <div key={provider.providerId} className="grid min-w-0 grid-cols-[28px_44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"><span className="text-xs font-black text-slate-400">{index + 1}</span><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">{initials(provider.providerName)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{provider.providerName}</p><p className="mt-0.5 text-xs font-bold text-slate-500">{provider.listingCount.toLocaleString()} listings</p></div><span className="inline-flex items-center gap-1 text-xs font-black text-slate-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(provider.averageRating || 0).toFixed(1)}</span></div>) : <EmptyMini icon={Star} title="No top providers" description="Top providers appear when active listings exist." />}<button type="button" disabled className="mt-3 inline-flex h-10 items-center text-sm font-black text-blue-600 disabled:opacity-60 dark:text-blue-300">View all providers</button></div>;
const RecentSubmissions = ({ listings, loading, onRetry }: { listings: AdminListing[]; loading: boolean; onRetry: () => void }) => (
  <div className="mt-5 space-y-3">
    {loading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />) : listings.length > 0 ? listings.map((listing, index) => {
      const row = normalizeListingRow(listing);
      return (
        <div key={row.id ?? row.slug ?? `recent-listing-${index}`} className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800">
          {row.thumbnail ? <img src={row.thumbnail} alt={row.title} className="h-12 w-14 rounded-xl object-cover" loading="lazy" /> : <span className="flex h-12 w-14 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">{initials(row.title)}</span>}
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{row.title}</p><p className="mt-0.5 truncate text-xs font-bold text-slate-500">{row.locationLabel} · {relativeTime(String(listing.submittedAt || listing.updatedAt || listing.createdAt || ''))}</p></div>
          <StatusBadge status={row.status} />
        </div>
      );
    }) : <EmptyMini icon={FileClock} title="No recent submissions" description="Pending and draft listings will appear here." />}
    <button type="button" onClick={onRetry} className="mt-3 inline-flex h-10 items-center text-sm font-black text-blue-600 dark:text-blue-300">Refresh listings</button>
  </div>
);
const EmptyMini = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => <div className="mx-auto flex max-w-[260px] flex-col items-center justify-center text-center"><Icon className="h-9 w-9 text-blue-500" /><h4 className="mt-3 text-sm font-black text-slate-950 dark:text-slate-50">{title}</h4><p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p></div>;

void ManagementBanner;
void ListingStatsGrid;
void ListingFilters;
void ListingAnalyticsGrid;
