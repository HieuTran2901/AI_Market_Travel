import React from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MotionConfig, motion } from 'framer-motion';
import {
  Activity,
  BadgeCheck,
  Ban,
  Bell,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  CreditCard,
  Download,
  ExternalLink,
  FileBarChart,
  FileClock,
  Filter,
  Gavel,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  TrendingUp,
  UserCheck,
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
import { adminProviderService } from '@/services/adminProviderService';
import { PageResponse } from '@/types';
import {
  AdminProvider,
  AdminProviderCategoryDistribution,
  AdminProviderGrowthPoint,
  AdminProviderSearchParams,
  AdminProviderStatistics,
} from '@/types/adminProvider';

type NavItem = {
  label: string;
  icon: React.ElementType;
  to?: string;
  group?: 'main' | 'management' | 'operations' | 'system';
};

type ProviderFilterState = {
  search: string;
  category: string;
  status: string;
  verification: string;
  joinedDate: string;
  pageSize: string;
  tab: string;
  page: string;
};

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
  { label: 'Audit Logs', icon: FileClock, group: 'system' },
  { label: 'System Health', icon: Activity, group: 'system' },
];

const groupedNav = [
  { label: null, items: adminNavItems.filter(item => item.group === 'main') },
  { label: 'Management', items: adminNavItems.filter(item => item.group === 'management') },
  { label: 'Operations', items: adminNavItems.filter(item => item.group === 'operations') },
  { label: 'System', items: adminNavItems.filter(item => item.group === 'system') },
];

const initialFilters: ProviderFilterState = {
  search: '',
  category: 'all',
  status: 'all',
  verification: 'all',
  joinedDate: '',
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

function initials(name?: string) {
  if (!name) return 'P';
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? value.toLocaleString() : '-';
}

function labelize(value?: string) {
  if (!value) return '-';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function parseJoinedRange(value: string) {
  const [fromRaw, toRaw] = value.split(/\s+to\s+|\s+-\s+/i).map(part => part?.trim()).filter(Boolean);
  const toIso = (date: string | undefined, endOfDay = false) => {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return undefined;
    parsed.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return parsed.toISOString();
  };
  return { joinedFrom: toIso(fromRaw), joinedTo: toIso(toRaw ?? fromRaw, true) };
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

function getInitialFilters(searchParams: URLSearchParams): ProviderFilterState {
  return {
    search: searchParams.get('keyword') ?? '',
    category: searchParams.get('category') ?? 'all',
    status: searchParams.get('status') ?? 'all',
    verification: searchParams.get('verification') ?? 'all',
    joinedDate: searchParams.get('joinedDate') ?? '',
    pageSize: searchParams.get('size') ?? '10',
    tab: searchParams.get('tab') ?? 'all',
    page: searchParams.get('page') ?? '0',
  };
}

function toApiParams(filters: ProviderFilterState, debouncedSearch: string): AdminProviderSearchParams {
  const range = parseJoinedRange(filters.joinedDate);
  const tabStatus = filters.tab === 'active' ? 'APPROVED' : filters.tab === 'pending' ? 'PENDING' : filters.tab === 'suspended' ? 'SUSPENDED' : undefined;
  return {
    page: Math.max(Number(filters.page) || 0, 0),
    size: Math.min(Math.max(Number(filters.pageSize) || 10, 1), 100),
    sort: 'createdAt,desc',
    keyword: debouncedSearch.trim() || undefined,
    category: filters.category !== 'all' ? filters.category.toUpperCase() : undefined,
    status: filters.status !== 'all' ? filters.status.toUpperCase() : tabStatus,
    verification: filters.verification !== 'all' ? filters.verification.toUpperCase() : undefined,
    ...range,
  };
}

function countActiveFilters(filters: ProviderFilterState) {
  return [
    filters.search.trim(),
    filters.category !== 'all',
    filters.status !== 'all',
    filters.verification !== 'all',
    filters.joinedDate,
  ].filter(Boolean).length;
}

export const AdminProvidersPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const { collapsed: sidebarCollapsed, compact: sidebarCompact, labelsHidden: sidebarLabelsHidden, transitioning: sidebarTransitioning, toggle: toggleSidebarCollapsed } = useAdminSidebarCollapse();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState<ProviderFilterState>(() => getInitialFilters(searchParams));
  const [mutationMessage, setMutationMessage] = React.useState<string | null>(null);
  const profileRef = React.useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adminName = user?.fullName || user?.email || 'Administrator';
  const activeFilters = countActiveFilters(filters);
  const debouncedSearch = useDebouncedValue(filters.search, 400);
  const providerQueryParams = React.useMemo(() => toApiParams(filters, debouncedSearch), [filters, debouncedSearch]);

  const providersQuery = useQuery({
    queryKey: ['admin-providers', providerQueryParams],
    queryFn: () => adminProviderService.getProviders(providerQueryParams),
    staleTime: 30_000,
  });
  const statisticsQuery = useQuery({ queryKey: ['admin-providers-statistics'], queryFn: () => adminProviderService.getStatistics(), staleTime: 60_000 });
  const growthQuery = useQuery({ queryKey: ['admin-providers-growth', '30d'], queryFn: () => adminProviderService.getGrowth('30d'), staleTime: 60_000 });
  const categoriesQuery = useQuery({ queryKey: ['admin-providers-categories'], queryFn: () => adminProviderService.getCategoryDistribution(), staleTime: 60_000 });
  const topRatedQuery = useQuery({ queryKey: ['admin-providers-top-rated'], queryFn: () => adminProviderService.getTopRated(5), staleTime: 60_000 });

  const invalidateProviders = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-providers-statistics'] });
    queryClient.invalidateQueries({ queryKey: ['admin-providers-categories'] });
    queryClient.invalidateQueries({ queryKey: ['admin-providers-top-rated'] });
  };

  const providerMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'verify' | 'suspend' | 'reactivate' }) => {
      if (action === 'verify') return adminProviderService.verifyProvider(id);
      if (action === 'reactivate') return adminProviderService.reactivateProvider(id);
      return adminProviderService.suspendProvider(id, 'Suspended from admin provider management.');
    },
    onSuccess: response => {
      setMutationMessage(response.message || 'Provider updated.');
      invalidateProviders();
      window.setTimeout(() => setMutationMessage(null), 2600);
    },
    onError: error => {
      const message = error instanceof Error ? error.message : 'Provider action failed.';
      setMutationMessage(message);
      window.setTimeout(() => setMutationMessage(null), 3600);
    },
  });

  const providersPage = providersQuery.data?.data;
  const statistics = statisticsQuery.data?.data;

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (filters.search.trim()) next.set('keyword', filters.search.trim());
    if (filters.category !== 'all') next.set('category', filters.category);
    if (filters.status !== 'all') next.set('status', filters.status);
    if (filters.verification !== 'all') next.set('verification', filters.verification);
    if (filters.joinedDate) next.set('joinedDate', filters.joinedDate);
    if (filters.pageSize !== '10') next.set('size', filters.pageSize);
    if (filters.tab !== 'all') next.set('tab', filters.tab);
    if (filters.page !== '0') next.set('page', filters.page);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  React.useEffect(() => {
    if (!profileOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [profileOpen]);

  const updateFilter = <K extends keyof ProviderFilterState>(key: K, value: ProviderFilterState[K]) => {
    setFilters(current => ({ ...current, [key]: value, page: key === 'page' ? String(value) : '0' }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={`admin-theme ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
        <div className="flex min-h-dvh min-w-0 overflow-x-hidden bg-[#f7f9fc] text-slate-950 transition-colors duration-200 dark:bg-[#07111f] dark:text-slate-50">
          {drawerOpen && <button type="button" aria-label="Close admin navigation" className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm xl:hidden" onClick={() => setDrawerOpen(false)} />}
          <AdminProvidersSidebar drawerOpen={drawerOpen} collapsed={sidebarCompact} labelsHidden={sidebarLabelsHidden} toggleDisabled={sidebarTransitioning} toggleCollapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebarCollapsed} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
          <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCompact ? 'xl:pl-[80px]' : 'xl:pl-[240px]'}`}>
            <AdminProvidersHeader adminName={adminName} onOpenDrawer={() => setDrawerOpen(true)} onLogout={handleLogout} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} avatarUrl={user?.avatarUrl} />
            <main className="min-w-0 flex-1 px-4 py-5 md:px-6 2xl:px-8">
              <MotionDiv className="mx-auto w-full max-w-[1680px] min-w-0 space-y-5" variants={pageSequence} initial="hidden" animate="visible">
                <MotionDiv variants={fadeUp} transition={quickTransition}><ProviderPageActions /></MotionDiv>
                {mutationMessage && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{mutationMessage}</div>}
                <MotionDiv variants={fadeUp} transition={quickTransition}><ProviderTrustBanner /></MotionDiv>
                <MotionDiv variants={fadeUp} transition={quickTransition}><ProviderStatsGrid statistics={statistics} loading={statisticsQuery.isLoading} error={statisticsQuery.isError} onRetry={() => statisticsQuery.refetch()} /></MotionDiv>
                <MotionDiv variants={fadeUp} transition={quickTransition}><ProviderFilters filters={filters} activeFilters={activeFilters} onChange={updateFilter} onClear={() => setFilters(initialFilters)} /></MotionDiv>
                <MotionDiv variants={fadeUp} transition={quickTransition}>
                  <div className="grid min-w-0 gap-5 min-[1536px]:grid-cols-[minmax(0,1fr)_minmax(340px,0.34fr)]">
                    <ProvidersTable
                      filters={filters}
                      activeFilters={activeFilters}
                      statistics={statistics}
                      providers={providersPage?.content ?? []}
                      page={providersPage}
                      loading={providersQuery.isLoading || providersQuery.isFetching}
                      error={providersQuery.isError}
                      onRetry={() => providersQuery.refetch()}
                      onChange={updateFilter}
                      onAction={(id, action) => providerMutation.mutate({ id, action })}
                      actionLoadingId={providerMutation.isPending ? providerMutation.variables?.id : undefined}
                    />
                    <ProviderAnalyticsColumn
                      statistics={statistics}
                      growth={growthQuery.data?.data?.points ?? []}
                      categories={categoriesQuery.data?.data ?? []}
                      topRated={topRatedQuery.data?.data ?? []}
                      loading={statisticsQuery.isLoading || growthQuery.isLoading || categoriesQuery.isLoading || topRatedQuery.isLoading}
                    />
                  </div>
                </MotionDiv>
              </MotionDiv>
            </main>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};

const AdminProvidersHeader = ({
  adminName,
  onOpenDrawer,
  onLogout,
  profileOpen,
  setProfileOpen,
  profileRef,
  avatarUrl,
}: {
  adminName: string;
  onOpenDrawer: () => void;
  onLogout: () => void;
  profileOpen: boolean;
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profileRef: React.RefObject<HTMLDivElement>;
  avatarUrl?: string;
}) => (
  <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800 dark:bg-[#081321]/92">
    <div className="mx-auto flex h-20 w-full max-w-[1680px] min-w-0 items-center justify-between gap-5 px-4 md:px-6 2xl:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden" onClick={onOpenDrawer} aria-label="Open admin navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight text-blue-600 md:text-2xl">Providers</h1>
          <div className="mt-1 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:flex">
            <Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Providers</span>
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3">
        <button className="hidden h-11 w-full max-w-[430px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-500 shadow-sm transition hover:border-blue-100 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-blue-400/40 md:flex">
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search anything...</span>
          <span className="ml-auto shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-400 dark:bg-slate-800 dark:text-slate-500">Ctrl K</span>
        </button>
        <HeaderIconButton icon={Search} label="Search" className="md:hidden" />
        <HeaderIconButton icon={Bell} label="Notifications" badge="3" />
        <HeaderIconButton icon={MessageSquare} label="Messages" />
        <ThemeToggle />
        <div ref={profileRef} className="relative shrink-0">
          <button type="button" aria-haspopup="menu" aria-expanded={profileOpen} onClick={() => setProfileOpen(open => !open)} className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/60 dark:border-slate-700/70 dark:bg-slate-900/80 dark:hover:border-blue-400/40">
            {avatarUrl ? <img src={avatarUrl} alt={adminName} className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{initials(adminName)}</span>}
            <span className="hidden text-left lg:block">
              <span className="block max-w-[150px] truncate text-sm font-black text-slate-950 dark:text-slate-50">{adminName}</span>
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Administrator</span>
            </span>
            <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/70 dark:border-slate-700/70 dark:bg-slate-900 dark:shadow-slate-950/50">
              <div className="flex items-center gap-3 px-3 py-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{initials(adminName)}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">{adminName}</p>
                  <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Administrator</p>
                </div>
              </div>
              <ThemeMenu />
              <div className="border-t border-slate-200/80 p-2 dark:border-slate-700/70">
                <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);

const AdminProvidersSidebar = ({ drawerOpen, collapsed, labelsHidden, toggleDisabled, toggleCollapsed, onToggleCollapsed, onClose, onLogout }: { drawerOpen: boolean; collapsed: boolean; labelsHidden: boolean; toggleDisabled: boolean; toggleCollapsed: boolean; onToggleCollapsed: () => void; onClose: () => void; onLogout: () => void }) => {
  const location = useLocation();
  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 transform flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-200/70 [height:100dvh] transition-[width,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-slate-800 dark:bg-[#081321] dark:shadow-slate-950/40 xl:z-40 xl:translate-x-0 xl:shadow-none ${collapsed ? 'xl:w-[80px]' : 'xl:w-[240px]'} ${drawerOpen ? 'w-[240px] translate-x-0' : 'w-[240px] -translate-x-full'}`}>
      <AdminSidebarCollapseButton collapsed={toggleCollapsed} disabled={toggleDisabled} onToggle={onToggleCollapsed} />
      <div className={`flex h-20 shrink-0 items-center justify-between transition-[padding] duration-200 ${collapsed ? 'xl:px-3' : 'px-5'}`}>
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={onClose}><img src="/brand/ai-marketplace-traveler-logo.png" alt="AI Marketplace Traveler" className={`h-12 w-auto object-contain transition-all duration-200 ${collapsed ? 'xl:max-w-[48px]' : ''}`} /></Link>
        <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 xl:hidden" onClick={onClose} aria-label="Close admin navigation"><X className="h-5 w-5" /></button>
      </div>
      <nav className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 pb-5 transition-[padding] duration-200 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[scrollbar-color:rgba(71,85,105,0.7)_transparent] dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 ${collapsed ? 'xl:px-3' : 'px-4'}`}>
        {groupedNav.map(group => (
          <div key={group.label || 'main'} className="mb-5">
            {group.label && <AdminSidebarSectionLabel hidden={labelsHidden}>{group.label}</AdminSidebarSectionLabel>}
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = item.to && location.pathname === item.to;
                if (item.to) {
                  return (
                    <Link key={item.label} to={item.to} title={collapsed ? item.label : undefined} onClick={onClose} className={`group flex items-center rounded-2xl text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${collapsed ? 'xl:mx-auto xl:h-12 xl:w-12 xl:justify-center xl:p-0' : 'gap-3 px-4 py-3'} ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'}`}>
                      <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                      <AdminSidebarText hidden={labelsHidden}>{item.label}</AdminSidebarText>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-[opacity,max-width] duration-200 ${labelsHidden ? 'max-w-0 opacity-0' : 'max-w-4 opacity-60'}`} />
                    </Link>
                  );
                }
                return <button key={item.label} type="button" disabled title={collapsed ? item.label : 'No admin route is currently wired for this feature.'} className={`flex items-center rounded-2xl text-left text-sm font-bold text-slate-400 opacity-75 dark:text-slate-600 ${collapsed ? 'xl:mx-auto xl:h-12 xl:w-12 xl:justify-center xl:p-0' : 'w-full gap-3 px-4 py-3'}`}><Icon className="h-5 w-5 shrink-0" /><AdminSidebarText hidden={labelsHidden}>{item.label}</AdminSidebarText></button>;
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className={`shrink-0 space-y-3 border-t border-slate-200/80 bg-white p-4 transition-[padding] duration-200 dark:border-slate-800 dark:bg-[#081321] ${collapsed ? 'xl:px-3' : ''}`}>
        <Link to="/" title={collapsed ? 'View Site' : undefined} onClick={onClose} className={`flex h-12 items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/20 ${collapsed ? 'xl:justify-center xl:px-0' : ''}`}><AdminSidebarText hidden={labelsHidden} className="font-black">View Site</AdminSidebarText><ExternalLink className="h-4 w-4 shrink-0" /></Link>
        <button type="button" title={collapsed ? 'Sign out' : undefined} onClick={onLogout} className={`flex h-12 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-red-600 transition hover:border-red-100 hover:bg-red-50 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-red-400 dark:hover:border-red-400/30 dark:hover:bg-red-500/10 ${collapsed ? 'xl:justify-center xl:px-0' : ''}`}><LogOut className="h-5 w-5 shrink-0" /><AdminSidebarText hidden={labelsHidden} className="font-black">Sign out</AdminSidebarText></button>
      </div>
    </aside>
  );
};

const HeaderIconButton = ({ icon: Icon, label, badge, className = '' }: { icon: React.ElementType; label: string; badge?: string; className?: string }) => (
  <button type="button" aria-label={label} title={label} className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-100 hover:text-blue-700 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}>
    <Icon className="h-5 w-5" />
    {badge && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900">{badge}</span>}
  </button>
);

const ProviderPageActions = () => (
  <section className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">Providers</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Manage all service providers on the marketplace.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled title="Provider creation uses the registration flow." className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition duration-150 enabled:hover:-translate-y-0.5 enabled:hover:bg-blue-700 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"><Plus className="h-4 w-4" />Add Provider</button>
      <button type="button" disabled title="Export endpoint is not available yet." className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition duration-150 enabled:hover:-translate-y-0.5 enabled:hover:border-blue-200 enabled:hover:text-blue-700 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200"><Download className="h-4 w-4" />Export</button>
    </div>
  </section>
);

const ProviderTrustBanner = () => {
  const indicators = [
    { label: 'Verified Pros', text: 'Approved businesses', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 ring-blue-100' },
    { label: 'Quality Services', text: 'Listing quality tracking', icon: BadgeCheck, color: 'text-cyan-600 bg-cyan-50 ring-cyan-100' },
    { label: 'Top Rated', text: 'Review-led insights', icon: Star, color: 'text-amber-600 bg-amber-50 ring-amber-100' },
    { label: 'Secure Payments', text: 'Protected payouts', icon: LockKeyhole, color: 'text-indigo-600 bg-indigo-50 ring-indigo-100' },
  ];
  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="grid min-w-0 gap-5 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:items-center">
        <div className="relative min-h-[116px] overflow-hidden rounded-[20px] bg-gradient-to-br from-blue-50 via-cyan-50/70 to-white p-5 dark:from-blue-500/15 dark:via-cyan-500/10 dark:to-slate-900">
          <div className="relative z-10 flex min-w-0 items-center gap-4">
            <ProviderIllustration />
            <div className="min-w-0">
              <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">Build a trusted community</h3>
              <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">Monitor provider activity, service quality, and verification health across the marketplace.</p>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-200/35 blur-2xl" />
        </div>
        <MotionDiv className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4" variants={pageSequence} initial="hidden" animate="visible">
          {indicators.map(item => {
            const Icon = item.icon;
            return (
              <MotionDiv key={item.label} variants={fadeUp} transition={quickTransition} className="group flex min-w-0 items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition duration-200 group-hover:-translate-y-0.5 ${item.color}`}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">{item.label}</p><p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{item.text}</p></div>
              </MotionDiv>
            );
          })}
        </MotionDiv>
      </div>
    </section>
  );
};

const ProviderIllustration = () => (
  <div className="relative flex h-20 w-28 shrink-0 items-center justify-center" aria-hidden="true">
    <div className="absolute left-1 top-3 h-12 w-12 rounded-full bg-blue-100" />
    <div className="absolute right-2 top-1 h-14 w-14 rounded-full bg-cyan-100" />
    <div className="relative z-10 h-16 w-20 rounded-[20px] border border-blue-200 bg-white shadow-sm">
      <div className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600"><BriefcaseBusiness className="h-5 w-5" /></div>
      <div className="mx-auto mt-2 h-1.5 w-11 rounded-full bg-blue-100" />
    </div>
    <span className="absolute bottom-1 left-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white"><CheckCircle2 className="h-4 w-4" /></span>
    <span className="absolute bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-4 ring-white"><Star className="h-4 w-4" /></span>
  </div>
);

const ProviderStatsGrid = ({ statistics, loading, error, onRetry }: { statistics?: AdminProviderStatistics; loading: boolean; error: boolean; onRetry: () => void }) => {
  const stats = [
    { label: 'Total Providers', value: statistics?.totalProviders, helper: 'Registered provider profiles', icon: HeartHandshake, tone: 'blue' },
    { label: 'Active Providers', value: statistics?.activeProviders, helper: 'Approved and active', icon: UserCheck, tone: 'emerald' },
    { label: 'New Providers (30d)', value: statistics?.newProvidersLast30Days, helper: 'Recently joined providers', icon: TrendingUp, tone: 'amber' },
    { label: 'Verified Providers', value: statistics?.verifiedProviders, helper: 'Verification approved', icon: BadgeCheck, tone: 'violet' },
    { label: 'Suspended Providers', value: statistics?.suspendedProviders, helper: 'Temporarily restricted', icon: Ban, tone: 'rose' },
  ] as const;
  if (error) {
    return <section className="rounded-[22px] border border-red-100 bg-red-50/70 p-5 text-sm font-bold text-red-700"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>Unable to load provider statistics.</span><button type="button" onClick={onRetry} className="h-10 rounded-2xl bg-white px-4 text-sm font-black text-red-700 shadow-sm">Retry</button></div></section>;
  }
  return (
    <MotionSection className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5" variants={pageSequence} initial="hidden" animate="visible">
      {stats.map(stat => <ProviderStatCard key={stat.label} stat={stat} loading={loading} />)}
    </MotionSection>
  );
};

const statTones: Record<string, { icon: string; helper: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-600 ring-blue-100', helper: 'text-blue-700' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100', helper: 'text-emerald-700' },
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-100', helper: 'text-amber-700' },
  violet: { icon: 'bg-violet-50 text-violet-600 ring-violet-100', helper: 'text-violet-700' },
  rose: { icon: 'bg-rose-50 text-rose-600 ring-rose-100', helper: 'text-rose-700' },
};

const ProviderStatCard = ({ stat, loading }: { stat: { label: string; value?: number; helper: string; icon: React.ElementType; tone: string }; loading: boolean }) => {
  const Icon = stat.icon;
  const tone = statTones[stat.tone];
  return (
    <MotionArticle variants={fadeUp} transition={quickTransition} whileHover={{ y: -3 }} className="flex min-h-[132px] min-w-0 items-center gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/70 dark:border-slate-700/60 dark:bg-slate-900/80">
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 ${tone.icon}`}><Icon className="h-6 w-6" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
        {loading ? <div className="mt-3 h-8 w-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /> : <p className="mt-2 truncate whitespace-nowrap text-[28px] font-black leading-tight tracking-tight text-slate-950 dark:text-slate-50">{formatNumber(stat.value)}</p>}
        <p className={`mt-2 line-clamp-1 text-xs font-black ${tone.helper}`}>{loading ? 'Loading...' : stat.helper}</p>
      </div>
    </MotionArticle>
  );
};

const ProviderFilters = ({ filters, activeFilters, onChange, onClear }: { filters: ProviderFilterState; activeFilters: number; onChange: <K extends keyof ProviderFilterState>(key: K, value: ProviderFilterState[K]) => void; onClear: () => void }) => (
  <section className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
    <div className="grid min-w-0 gap-3 lg:grid-cols-2 xl:[grid-template-columns:minmax(260px,1.5fr)_repeat(4,minmax(140px,0.65fr))_auto]">
      <label className="relative min-w-0"><span className="sr-only">Search providers</span><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={filters.search} onChange={event => onChange('search', event.target.value)} placeholder="Search by name, email, phone, or service..." className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200" /></label>
      <FilterSelect value={filters.category} onChange={value => onChange('category', value)} options={['All Categories', 'Hotel', 'Tour', 'Restaurant', 'Vehicle', 'Experience']} />
      <FilterSelect value={filters.status} onChange={value => onChange('status', value)} options={['All Statuses', 'Active', 'Pending', 'Suspended', 'Rejected']} />
      <FilterSelect value={filters.verification} onChange={value => onChange('verification', value)} options={['All', 'Approved', 'Pending', 'Suspended', 'Rejected']} />
      <label className="relative min-w-0"><span className="sr-only">Joined date range</span><Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={filters.joinedDate} onChange={event => onChange('joinedDate', event.target.value)} placeholder="Joined date range" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200" /></label>
      <button type="button" disabled={activeFilters === 0} onClick={onClear} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-blue-300"><X className="h-4 w-4" />Clear filters</button>
    </div>
  </section>
);

const FilterSelect = ({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) => (
  <label className="min-w-0"><select value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200">{options.map((option, index) => <option key={option} value={index === 0 ? 'all' : option.toLowerCase().replace(/\s+/g, '-')}>{option}</option>)}</select></label>
);

const ProvidersTable = ({ filters, activeFilters, statistics, providers, page, loading, error, onRetry, onChange, onAction, actionLoadingId }: { filters: ProviderFilterState; activeFilters: number; statistics?: AdminProviderStatistics; providers: AdminProvider[]; page?: PageResponse<AdminProvider>; loading: boolean; error: boolean; onRetry: () => void; onChange: <K extends keyof ProviderFilterState>(key: K, value: ProviderFilterState[K]) => void; onAction: (id: number, action: 'verify' | 'suspend' | 'reactivate') => void; actionLoadingId?: number }) => {
  const tabs = [
    { key: 'all', label: 'All Providers', count: statistics?.totalProviders ?? page?.totalElements ?? 0 },
    { key: 'active', label: 'Active', count: statistics?.activeProviders ?? 0 },
    { key: 'pending', label: 'Pending', count: statistics?.pendingProviders ?? 0 },
    { key: 'suspended', label: 'Suspended', count: statistics?.suspendedProviders ?? 0 },
  ];
  const total = page?.totalElements ?? 0;
  const pageNumber = page?.number ?? Number(filters.page) ?? 0;
  const pageSize = page?.size ?? Number(filters.pageSize) ?? 10;
  const totalPages = page?.totalPages ?? 1;
  const start = total === 0 ? 0 : pageNumber * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + providers.length - 1, total);
  return (
    <section className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="flex min-w-0 flex-col gap-4 border-b border-slate-200/80 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(tab => <button key={tab.key} type="button" onClick={() => onChange('tab', tab.key)} className={`relative shrink-0 overflow-hidden rounded-2xl px-4 py-2 text-sm font-black transition active:scale-[0.98] ${filters.tab === tab.key ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400'}`}>{filters.tab === tab.key && <MotionDiv layoutId="admin-providers-active-tab" className="absolute inset-0 rounded-2xl bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:ring-blue-400/20" transition={{ duration: 0.2 }} />}<span className="relative z-10">{tab.label} <span className="text-xs opacity-70">({(tab.count ?? 0).toLocaleString()})</span></span></button>)}
        </div>
        <div className="flex flex-wrap gap-2"><ToolbarButton icon={Columns3} label="Columns" /><ToolbarButton icon={Filter} label="Filters" badge={activeFilters} /><label className="min-w-[130px]"><select value={filters.pageSize} disabled={loading} onChange={event => onChange('pageSize', event.target.value)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300">{['10', '20', '50', '100'].map(size => <option key={size} value={size}>{size} / page</option>)}</select></label></div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full border-collapse">
          <thead className="bg-slate-50/90 text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400"><tr><th className="w-12 px-5 py-4"><input type="checkbox" disabled className="h-4 w-4 rounded border-slate-300" /></th><th className="px-4 py-4">Provider</th><th className="px-4 py-4">Service Category</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Verified</th><th className="px-4 py-4">Rating</th><th className="px-4 py-4">Joined Date</th><th className="px-4 py-4">Bookings</th><th className="px-4 py-4 text-right">Actions</th></tr></thead>
          <MotionTbody key={`${loading}-${error}-${pageNumber}-${filters.tab}-${providers.map(provider => provider.id).join('-')}`} className="divide-y divide-slate-100 dark:divide-slate-800" initial={{ opacity: 0.68 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
            {loading && <ProviderSkeletonRows />}
            {!loading && error && <tr><td colSpan={9} className="px-5 py-12"><TableState icon={ShieldAlert} title="Unable to load providers" description="The admin providers API could not be reached." action={<button type="button" onClick={onRetry} className="mt-4 h-10 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">Retry</button>} /></td></tr>}
            {!loading && !error && providers.length === 0 && <tr><td colSpan={9} className="px-5 py-12"><TableState icon={HeartHandshake} title="No providers found" description={activeFilters > 0 ? 'Try clearing filters or broadening your search.' : 'No provider profiles are available yet.'} /></td></tr>}
            {!loading && !error && providers.map((provider, index) => <ProviderTableRow key={provider.id} provider={provider} index={index} onAction={onAction} actionLoading={actionLoadingId === provider.id} />)}
          </MotionTbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200/80 px-5 py-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Showing {start.toLocaleString()} to {end.toLocaleString()} of {total.toLocaleString()} providers</span><div className="flex items-center gap-1"><PaginationButton icon={ChevronLeft} disabled={loading || pageNumber <= 0} onClick={() => onChange('page', String(pageNumber - 1))} />{Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => <button key={index} type="button" disabled={loading} onClick={() => onChange('page', String(index))} className={`relative h-9 min-w-9 overflow-hidden rounded-xl px-3 text-sm font-black transition active:scale-[0.97] ${index === pageNumber ? 'text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300'}`}>{index === pageNumber && <MotionDiv layoutId="admin-providers-active-page" className="absolute inset-0 rounded-xl bg-blue-600" transition={{ duration: 0.18 }} />}<span className="relative z-10">{index + 1}</span></button>)}{totalPages > 5 && <span className="px-2 text-slate-400">...</span>}<PaginationButton icon={ChevronRight} disabled={loading || pageNumber >= totalPages - 1} onClick={() => onChange('page', String(pageNumber + 1))} /></div></div>
    </section>
  );
};

const ProviderTableRow = ({ provider, index, onAction, actionLoading }: { provider: AdminProvider; index: number; onAction: (id: number, action: 'verify' | 'suspend' | 'reactivate') => void; actionLoading: boolean }) => {
  const canVerify = provider.verificationStatus === 'PENDING' || provider.verificationStatus === 'REJECTED';
  const canSuspend = provider.status === 'ACTIVE';
  const canReactivate = provider.status === 'SUSPENDED';
  return (
    <MotionTr initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.18) }} className="group transition-colors hover:bg-blue-50/35 dark:hover:bg-blue-500/5">
      <td className="w-12 px-5 py-4"><input type="checkbox" className="h-4 w-4 rounded border-slate-300" aria-label={`Select ${provider.businessName}`} /></td>
      <td className="px-4 py-4"><div className="flex min-w-0 items-center gap-3">{provider.avatarUrl ? <img src={provider.avatarUrl} alt={provider.businessName} className="h-11 w-11 shrink-0 rounded-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" loading="lazy" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-black text-blue-700 transition-transform duration-200 group-hover:scale-[1.03]">{initials(provider.businessName)}</span>}<div className="min-w-0"><p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">{provider.businessName}</p><p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{provider.email || provider.contactName || 'No email'}</p><p className="truncate text-xs font-semibold text-slate-400 dark:text-slate-500">{provider.phone || 'No phone'}</p></div></div></td>
      <td className="px-4 py-4"><CategoryBadge category={provider.serviceCategory} /></td>
      <td className="px-4 py-4"><StatusBadge status={provider.status} /></td>
      <td className="px-4 py-4"><VerificationBadge status={provider.verificationStatus} /></td>
      <td className="px-4 py-4"><span className="inline-flex items-center gap-1 text-sm font-black text-slate-800 dark:text-slate-200"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{Number(provider.rating || 0).toFixed(1)} <span className="text-xs text-slate-400">({provider.reviewCount})</span></span></td>
      <td className="px-4 py-4 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">{formatDateTime(provider.createdAt)}</td>
      <td className="px-4 py-4 text-sm font-black text-slate-800 dark:text-slate-200">{provider.bookingCount.toLocaleString()}</td>
      <td className="px-4 py-4">
        <div className="flex justify-end gap-1">
          {canVerify && <ActionIcon icon={BadgeCheck} label="Verify provider" disabled={actionLoading} onClick={() => onAction(provider.id, 'verify')} />}
          {canSuspend && <ActionIcon icon={Ban} label="Suspend provider" disabled={actionLoading} onClick={() => onAction(provider.id, 'suspend')} />}
          {canReactivate && <ActionIcon icon={CheckCircle2} label="Reactivate provider" disabled={actionLoading} onClick={() => onAction(provider.id, 'reactivate')} />}
          {!canVerify && !canSuspend && !canReactivate && <span className="inline-flex h-9 items-center px-2 text-xs font-black text-slate-400">No action</span>}
        </div>
      </td>
    </MotionTr>
  );
};

const CategoryBadge = ({ category }: { category: string }) => <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20">{labelize(category)}</span>;
const StatusBadge = ({ status }: { status: string }) => {
  const styles = status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : status === 'SUSPENDED' || status === 'REJECTED' ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-amber-50 text-amber-700 ring-amber-100';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${styles}`}>{labelize(status)}</span>;
};
const VerificationBadge = ({ status }: { status: string }) => {
  const styles = status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : status === 'REJECTED' || status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-amber-50 text-amber-700 ring-amber-100';
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${styles}`}><BadgeCheck className="h-3.5 w-3.5" />{status === 'APPROVED' ? 'Verified' : labelize(status)}</span>;
};

const ActionIcon = ({ icon: Icon, label, onClick, disabled }: { icon: React.ElementType; label: string; onClick?: () => void; disabled?: boolean }) => (
  <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 opacity-80 transition duration-150 hover:-translate-y-px hover:bg-blue-50 hover:text-blue-700 hover:opacity-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 group-hover:text-slate-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 dark:group-hover:text-slate-300"><Icon className="h-4 w-4" /></button>
);

const ToolbarButton = ({ icon: Icon, label, badge }: { icon: React.ElementType; label: string; badge?: number }) => <button type="button" disabled className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 shadow-sm transition duration-150 hover:-translate-y-px active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-75 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300"><Icon className="h-4 w-4 text-blue-600" />{label}{!!badge && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] text-white">{badge}</span>}</button>;
const PaginationButton = ({ icon: Icon, disabled, onClick }: { icon: React.ElementType; disabled?: boolean; onClick?: () => void }) => <button type="button" disabled={disabled} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition duration-150 hover:-translate-y-px hover:border-blue-200 hover:text-blue-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-400"><Icon className="h-4 w-4" /></button>;

const ProviderSkeletonRows = () => <>{Array.from({ length: 6 }).map((_, index) => <tr key={index}><td className="px-5 py-4"><div className="h-4 w-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /></td><td className="px-4 py-4"><div className="h-11 w-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" /></td>{Array.from({ length: 7 }).map((__, cellIndex) => <td key={cellIndex} className="px-4 py-4"><div className="h-7 w-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /></td>)}</tr>)}</>;

const TableState = ({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) => <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-[22px] border border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center dark:border-blue-400/20 dark:bg-blue-500/10"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-slate-900 dark:text-blue-300 dark:ring-blue-400/20"><Icon className="h-7 w-7" /></span><h3 className="mt-4 text-lg font-black text-slate-950 dark:text-slate-50">{title}</h3><p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p>{action}</div>;

const ProviderAnalyticsColumn = ({ statistics, growth, categories, topRated, loading }: { statistics?: AdminProviderStatistics; growth: AdminProviderGrowthPoint[]; categories: AdminProviderCategoryDistribution[]; topRated: AdminProvider[]; loading: boolean }) => (
  <MotionSection className="grid min-w-0 gap-4 min-[1024px]:grid-cols-2 min-[1536px]:grid-cols-1" variants={pageSequence} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }}>
    <AnalyticsCard title="Provider Growth" action={<button type="button" disabled className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-black text-slate-500 disabled:opacity-70 dark:border-slate-700 dark:text-slate-400">Last 30 days</button>}><p className="mt-4 text-[32px] font-black leading-tight text-slate-950 dark:text-slate-50">{loading ? '-' : formatNumber(statistics?.newProvidersLast30Days)}</p><p className="mt-1 text-[13px] font-black leading-5 text-emerald-600">{loading ? 'Loading...' : 'new providers in 30 days'}</p><GrowthSparkline points={growth} loading={loading} /></AnalyticsCard>
    <AnalyticsCard title="Providers by Category" action={<Building2 className="h-5 w-5 text-blue-500" />}><CategoryDistribution categories={categories} loading={loading} /></AnalyticsCard>
    <AnalyticsCard title="Top Rated Providers"><TopRatedProviders providers={topRated} loading={loading} /></AnalyticsCard>
  </MotionSection>
);

const AnalyticsCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => <MotionArticle variants={fadeUp} transition={quickTransition} className="min-h-[300px] w-full min-w-0 max-w-full rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80"><div className="flex min-w-0 items-center justify-between gap-3"><h3 className="min-w-0 text-lg font-semibold leading-tight tracking-tight text-slate-950 dark:text-slate-50">{title}</h3>{action && <div className="shrink-0">{action}</div>}</div>{children}</MotionArticle>;

const GrowthSparkline = ({ points, loading }: { points: AdminProviderGrowthPoint[]; loading: boolean }) => {
  const max = Math.max(...points.map(point => point.count), 1);
  const path = points.length ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${(index / Math.max(points.length - 1, 1)) * 260} ${110 - (point.count / max) * 90}`).join(' ') : '';
  return <div className="mt-4 flex min-h-[210px] items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center dark:border-slate-700 dark:bg-slate-950/40">{loading ? <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-100" /> : points.some(point => point.count > 0) ? <svg viewBox="0 0 260 120" className="h-40 w-full"><path d={path} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" /><path d={`${path} L260 120 L0 120 Z`} fill="rgba(37,99,235,0.08)" /></svg> : <EmptyMini icon={TrendingUp} title="No growth yet" description="Provider growth points are empty for this range." />}</div>;
};

const CategoryDistribution = ({ categories, loading }: { categories: AdminProviderCategoryDistribution[]; loading: boolean }) => <div className="mt-5 min-w-0 max-w-full space-y-4">{loading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded-2xl bg-slate-100" />) : categories.length > 0 ? categories.map((category, index) => <div key={category.category} className="min-w-0"><div className="flex min-w-0 items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-black text-slate-700 dark:text-slate-200">{labelize(category.category)}</span><span className="shrink-0 whitespace-nowrap font-black text-slate-400">{category.count.toLocaleString()} ({Number(category.percentage).toFixed(1)}%)</span></div><div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><motion.div className={`${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-violet-500' : index === 2 ? 'bg-amber-500' : 'bg-emerald-500'} h-full rounded-full`} initial={{ width: 0 }} whileInView={{ width: `${Math.min(Number(category.percentage), 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.48, delay: index * 0.06 }} /></div></div>) : <EmptyMini icon={Building2} title="No category data" description="Category distribution will appear when providers exist." />}</div>;

const TopRatedProviders = ({ providers, loading }: { providers: AdminProvider[]; loading: boolean }) => <div className="mt-5 space-y-3">{loading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />) : providers.length > 0 ? providers.map(provider => <div key={provider.id} className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">{initials(provider.businessName)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{provider.businessName}</p><p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">{labelize(provider.serviceCategory)}</p></div><span className="inline-flex items-center gap-1 text-xs font-black text-slate-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(provider.rating || 0).toFixed(1)}</span></div>) : <EmptyMini icon={Star} title="No rated providers" description="Top rated providers appear after published reviews." />}<button type="button" disabled className="mt-3 inline-flex h-10 items-center text-sm font-black text-blue-600 disabled:opacity-60 dark:text-blue-300">View all providers</button></div>;

const EmptyMini = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => <div className="mx-auto flex max-w-[260px] flex-col items-center justify-center text-center"><Icon className="h-9 w-9 text-blue-500" /><h4 className="mt-3 text-sm font-black text-slate-950 dark:text-slate-50">{title}</h4><p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p></div>;
