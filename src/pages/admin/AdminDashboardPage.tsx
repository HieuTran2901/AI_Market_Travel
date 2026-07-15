import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileBarChart,
  FileClock,
  Gavel,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { listingService } from '@/services/listingService';
import { adminDashboardService } from '@/services/adminDashboardService';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebarCollapseButton } from '@/components/admin/AdminSidebarCollapseButton';
import { AdminSidebarSectionLabel, AdminSidebarText } from '@/components/admin/AdminSidebarAnimatedText';
import { useAdminSidebarCollapse } from '@/components/admin/useAdminSidebarCollapse';
import { StateBlock } from '@/components/ui/StateBlock';
import { ListingResponse } from '@/types/listing';
import {
  AdminDashboardBookingsOverview,
  AdminDashboardRecentBooking,
  AdminDashboardSystemHealth,
  AdminDashboardUserGrowth,
} from '@/types/adminDashboard';
import { ThemeMenu, ThemeToggle } from '@/components/theme/ThemeControls';
import { useTheme } from '@/context/ThemeContext';

type NavItem = {
  label: string;
  icon: React.ElementType;
  to?: string;
  group?: 'main' | 'management' | 'operations' | 'system';
};

type MetricTone = 'blue' | 'emerald' | 'amber' | 'violet' | 'slate';

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

const toneStyles: Record<MetricTone, { icon: string; text: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20', text: 'text-blue-700 dark:text-blue-300' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20', text: 'text-emerald-700 dark:text-emerald-300' },
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20', text: 'text-amber-700 dark:text-amber-300' },
  violet: { icon: 'bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20', text: 'text-violet-700 dark:text-violet-300' },
  slate: { icon: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700', text: 'text-slate-700 dark:text-slate-300' },
};

const groupedNav = [
  { label: null, items: adminNavItems.filter(item => item.group === 'main') },
  { label: 'Management', items: adminNavItems.filter(item => item.group === 'management') },
  { label: 'Operations', items: adminNavItems.filter(item => item.group === 'operations') },
  { label: 'System', items: adminNavItems.filter(item => item.group === 'system') },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const MotionDiv = motion.div;

function money(value: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function count(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCategory(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function initials(name?: string) {
  if (!name) return 'A';
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export const AdminDashboardPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const { collapsed: sidebarCollapsed, compact: sidebarCompact, labelsHidden: sidebarLabelsHidden, transitioning: sidebarTransitioning, toggle: toggleSidebarCollapsed } = useAdminSidebarCollapse();
  const profileRef = React.useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const overviewQuery = useQuery({
    queryKey: ['admin-dashboard', 'overview'],
    queryFn: () => adminDashboardService.getOverview(),
    staleTime: 60_000,
  });

  const bookingsOverviewQuery = useQuery({
    queryKey: ['admin-dashboard', 'bookings-overview', '30d'],
    queryFn: () => adminDashboardService.getBookingsOverview('30d'),
    staleTime: 60_000,
  });

  const userGrowthQuery = useQuery({
    queryKey: ['admin-dashboard', 'user-growth', '30d'],
    queryFn: () => adminDashboardService.getUserGrowth('30d'),
    staleTime: 60_000,
  });

  const systemHealthQuery = useQuery({
    queryKey: ['admin-dashboard', 'system-health'],
    queryFn: () => adminDashboardService.getSystemHealth(),
    staleTime: 30_000,
  });

  const recentBookingsQuery = useQuery({
    queryKey: ['admin-dashboard', 'recent-bookings', 5],
    queryFn: () => adminDashboardService.getRecentBookings(5),
    staleTime: 30_000,
  });

  const topListingsQuery = useQuery({
    queryKey: ['admin-dashboard-active-listings'],
    queryFn: () => listingService.searchListings({ status: 'ACTIVE', page: 0, size: 8 }),
    staleTime: 60_000,
  });

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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
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

  const overview = overviewQuery.data?.data;
  const listings = topListingsQuery.data?.data?.content || [];
  const totalActiveListings = overview?.activeListings ?? topListingsQuery.data?.data?.totalElements ?? listings.length;
  const catalogValue = listings.reduce((sum, listing) => sum + (listing.basePrice || 0), 0);
  const currency = overview?.currency || listings[0]?.currency || 'VND';
  const topListings = [...listings]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 5);

  const animationProps = prefersReducedMotion ? {} : { initial: 'hidden', animate: 'show', variants: containerVariants };
  const adminName = user?.fullName || user?.email || 'Administrator';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`admin-theme ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <div className="flex min-h-dvh min-w-0 overflow-x-hidden bg-[#f7f9fc] text-slate-950 transition-colors duration-200 dark:bg-[#07111f] dark:text-slate-50">
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm xl:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <AdminSidebar onLogout={handleLogout} drawerOpen={drawerOpen} collapsed={sidebarCompact} labelsHidden={sidebarLabelsHidden} toggleDisabled={sidebarTransitioning} toggleCollapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebarCollapsed} onClose={() => setDrawerOpen(false)} />

      <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCompact ? 'xl:pl-[80px]' : 'xl:pl-[240px]'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800 dark:bg-[#081321]/92">
          <div className="mx-auto flex h-20 w-full max-w-[1600px] min-w-0 items-center justify-between gap-5 px-4 md:px-6 2xl:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-blue-600 md:text-2xl">Dashboard</h1>
                <p className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 md:block">Marketplace administration</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3">
              <button className="hidden h-11 w-full max-w-[430px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-500 shadow-sm transition hover:border-blue-100 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-blue-400/40 md:flex">
                <Search className="h-4 w-4 shrink-0" />
                <span className="truncate">Search anything...</span>
                <span className="ml-auto shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-400 dark:bg-slate-800 dark:text-slate-500">⌘K</span>
              </button>
              <IconButton icon={Search} label="Search" className="md:hidden" />
              <IconButton icon={Bell} label="Notifications" badge="!" />
              <IconButton icon={MessageSquare} label="Messages" />
              <ThemeToggle />
              <div ref={profileRef} className="relative shrink-0">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen(open => !open)}
                  className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/60 dark:border-slate-700/70 dark:bg-slate-900/80 dark:hover:border-blue-400/40"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={adminName} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{initials(adminName)}</span>
                  )}
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
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
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

        <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6 2xl:px-8">
          <MotionDiv className="mx-auto w-full max-w-[1600px] min-w-0 space-y-5" {...animationProps}>
            <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 md:flex-row md:items-center md:justify-between xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none xl:dark:bg-transparent">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">Welcome back, {adminName}! <span aria-hidden="true">👋</span></h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">Here's what's happening with your marketplace today.</p>
              </div>
              <button className="inline-flex h-11 items-center gap-3 self-start rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-100 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-blue-400/40">
                <CalendarCheck className="h-4 w-4 text-blue-600" />
                Current data
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </MotionDiv>

            <MotionDiv variants={containerVariants} className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
              <KpiCard title="Total Users" value={overviewQuery.isLoading ? '...' : overview ? count(overview.totalUsers) : '-'} helper={overviewQuery.isError ? 'Unable to load users' : 'All marketplace accounts'} icon={Users} tone="blue" />
              <KpiCard title="Active Listings" value={overviewQuery.isLoading ? '...' : count(totalActiveListings)} helper={overviewQuery.isError ? 'Unable to load listings' : 'Listings currently live'} icon={Store} tone="emerald" />
              <KpiCard title="Total Bookings" value={overviewQuery.isLoading ? '...' : overview ? count(overview.totalBookings) : '-'} helper={overviewQuery.isError ? 'Unable to load bookings' : 'All recorded bookings'} icon={CalendarCheck} tone="amber" />
              <KpiCard title="Total Revenue" value={overviewQuery.isLoading ? '...' : overview ? money(Number(overview.totalRevenue || 0), currency) : '-'} helper={overviewQuery.isError ? 'Unable to load revenue' : 'Completed settlement platform fees'} icon={CreditCard} tone="violet" />
              <KpiCard title="Total Providers" value={overviewQuery.isLoading ? '...' : overview ? count(overview.totalProviders) : '-'} helper={overviewQuery.isError ? 'Unable to load providers' : 'Registered provider profiles'} icon={ShieldCheck} tone="blue" />
            </MotionDiv>

            <div className="grid min-w-0 grid-cols-1 gap-5 min-[1280px]:grid-cols-2 min-[1440px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,0.72fr)]">
              <BookingsOverviewCard data={bookingsOverviewQuery.data?.data} loading={bookingsOverviewQuery.isLoading} error={bookingsOverviewQuery.isError} onRetry={() => bookingsOverviewQuery.refetch()} />
              <UserGrowthCard data={userGrowthQuery.data?.data} loading={userGrowthQuery.isLoading} error={userGrowthQuery.isError} onRetry={() => userGrowthQuery.refetch()} />
              <QuickActionsPanel />
            </div>

            <SystemHealthPanel data={systemHealthQuery.data?.data} loading={systemHealthQuery.isLoading} error={systemHealthQuery.isError} onRetry={() => systemHealthQuery.refetch()} />

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.75fr)_minmax(300px,0.65fr)]">
              <RecentBookingsPanel bookings={recentBookingsQuery.data?.data || []} loading={recentBookingsQuery.isLoading} error={recentBookingsQuery.isError} onRetry={() => recentBookingsQuery.refetch()} />
              <TopListingsPanel listings={topListings} loading={topListingsQuery.isLoading} />
              <AdminDataNotice catalogValue={catalogValue} currency={currency} activeListings={totalActiveListings} generatedAt={overview?.generatedAt} />
            </div>
          </MotionDiv>
        </main>
      </div>
      </div>
    </div>
  );
};

const AdminSidebar = ({
  drawerOpen,
  collapsed,
  labelsHidden,
  toggleDisabled,
  toggleCollapsed,
  onToggleCollapsed,
  onClose,
  onLogout,
}: {
  drawerOpen: boolean;
  collapsed: boolean;
  labelsHidden: boolean;
  toggleDisabled: boolean;
  toggleCollapsed: boolean;
  onToggleCollapsed: () => void;
  onClose: () => void;
  onLogout: () => void;
}) => {
  const location = useLocation();

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 transform flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-200/70 [height:100dvh] dark:border-slate-800 dark:bg-[#081321] dark:shadow-slate-950/40 transition-[width,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] xl:z-40 xl:translate-x-0 xl:shadow-none ${collapsed ? 'xl:w-[80px]' : 'xl:w-[240px]'}
      ${drawerOpen ? 'w-[240px] translate-x-0' : 'w-[240px] -translate-x-full'}
    `}>
      <AdminSidebarCollapseButton collapsed={toggleCollapsed} disabled={toggleDisabled} onToggle={onToggleCollapsed} />
      <div className={`flex h-20 shrink-0 items-center justify-between transition-[padding] duration-200 ${collapsed ? 'xl:px-3' : 'px-5'}`}>
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={onClose}>
          <img src="/brand/ai-marketplace-traveler-logo.png" alt="AI Marketplace Traveler" className={`h-12 w-auto object-contain transition-all duration-200 ${collapsed ? 'xl:max-w-[48px]' : ''}`} />
        </Link>
        <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 xl:hidden" onClick={onClose} aria-label="Close admin navigation">
          <X className="h-5 w-5" />
        </button>
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
                    <Link
                      key={item.label}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      onClick={onClose}
                      className={`group flex items-center rounded-2xl text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${collapsed ? 'xl:mx-auto xl:h-12 xl:w-12 xl:justify-center xl:p-0' : 'gap-3 px-4 py-3'} ${
                        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
                      <AdminSidebarText hidden={labelsHidden}>{item.label}</AdminSidebarText>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-[opacity,max-width] duration-200 ${labelsHidden ? 'max-w-0 opacity-0' : 'max-w-4 opacity-60'}`} />
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled
                    title={collapsed ? item.label : 'No admin route is currently wired for this feature.'}
                    className={`flex items-center rounded-2xl text-left text-sm font-bold text-slate-400 opacity-75 dark:text-slate-600 ${collapsed ? 'xl:mx-auto xl:h-12 xl:w-12 xl:justify-center xl:p-0' : 'w-full gap-3 px-4 py-3'}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <AdminSidebarText hidden={labelsHidden}>{item.label}</AdminSidebarText>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`shrink-0 space-y-3 border-t border-slate-200/80 bg-white p-4 transition-[padding] duration-200 dark:border-slate-800 dark:bg-[#081321] ${collapsed ? 'xl:px-3' : ''}`}>
        <Link
          to="/"
          title={collapsed ? 'View Site' : undefined}
          onClick={onClose}
          className={`flex h-12 items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/20 ${collapsed ? 'xl:justify-center xl:px-0' : ''}`}
        >
          <AdminSidebarText hidden={labelsHidden} className="font-black">View Site</AdminSidebarText> <ExternalLink className="h-4 w-4 shrink-0" />
        </Link>
        <button
          type="button"
          title={collapsed ? 'Sign out' : undefined}
          onClick={onLogout}
          className={`flex h-12 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-red-600 transition hover:border-red-100 hover:bg-red-50 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-red-400 dark:hover:border-red-400/30 dark:hover:bg-red-500/10 ${collapsed ? 'xl:justify-center xl:px-0' : ''}`}
        >
          <LogOut className="h-5 w-5" />
          <AdminSidebarText hidden={labelsHidden} className="font-black">Sign out</AdminSidebarText>
        </button>
      </div>
    </aside>
  );
};

const IconButton = ({ icon: Icon, label, badge, className = '' }: { icon: React.ElementType; label: string; badge?: string; className?: string }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-100 hover:text-blue-700 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
  >
    <Icon className="h-5 w-5" />
    {badge && (
      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900">
        {badge}
      </span>
    )}
  </button>
);

const KpiCard = ({
  title,
  value,
  helper,
  icon: Icon,
  tone,
  className = '',
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  tone: MetricTone;
  className?: string;
}) => {
  const styles = toneStyles[tone];
  const isUnavailable = value === 'Unavailable';
  const displayValue = isUnavailable ? '-' : value;
  return (
    <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className={`flex min-h-[150px] min-w-0 items-start gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:shadow-slate-950/40 ${className}`}>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ${styles.icon}`}>
          <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 truncate whitespace-nowrap text-[28px] font-black leading-tight tracking-tight text-slate-950 dark:text-slate-50 xl:text-[32px]">{displayValue}</p>
        <p className={`mt-4 line-clamp-2 text-xs font-black leading-5 ${styles.text}`}>{helper}</p>
      </div>
    </MotionDiv>
  );
};

const DashboardChartCard = ({
  title,
  subtitle,
  metric,
  change,
  points,
  valueKey,
  loading,
  error,
  onRetry,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  metric: string;
  change: number;
  points: Array<Record<string, string | number>>;
  valueKey: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  icon: React.ElementType;
}) => {
  const values = points.map(point => Number(point[valueKey] || 0));
  const hasData = values.some(value => value > 0);
  const max = Math.max(...values, 1);
  const width = 520;
  const height = 180;
  const path = values.map((value, index) => {
    const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - (value / max) * (height - 20) - 10;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  return (
    <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-400">Last 30 days</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-3xl font-black text-slate-950 dark:text-slate-50">{metric}</p>
        <p className={`text-sm font-black ${change >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </p>
      </div>
      <div className="mt-5 flex min-h-[230px] items-center justify-center rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-950/40">
        {loading ? (
          <StateBlock variant="loading" title="Loading chart" description="Fetching dashboard series." className="border-0 bg-transparent shadow-none" />
        ) : error ? (
          <StateBlock title="Chart unavailable" description="This section could not be loaded." className="border-0 bg-transparent shadow-none" actionLabel="Retry" onAction={onRetry} />
        ) : hasData ? (
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} line chart`} className="h-full min-h-[180px] w-full overflow-visible">
            <defs>
              <linearGradient id={`${title.replace(/\s+/g, '-')}-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${title.replace(/\s+/g, '-')}-gradient)`} />
            <path d={path} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div className="text-center">
            <Icon className="mx-auto h-10 w-10 text-blue-500" />
            <h3 className="mt-3 text-base font-black text-slate-950 dark:text-slate-50">No activity yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">This chart will populate automatically when matching marketplace records exist.</p>
          </div>
        )}
      </div>
    </MotionDiv>
  );
};

const BookingsOverviewCard = ({ data, loading, error, onRetry }: { data?: AdminDashboardBookingsOverview; loading: boolean; error: boolean; onRetry: () => void }) => (
  <DashboardChartCard
    title="Bookings Overview"
    subtitle="Real booking records grouped by creation date"
    metric={data ? count(data.total) : '-'}
    change={data?.changePercentage ?? 0}
    points={data?.points || []}
    valueKey="count"
    loading={loading}
    error={error}
    onRetry={onRetry}
    icon={CalendarCheck}
  />
);

const UserGrowthCard = ({ data, loading, error, onRetry }: { data?: AdminDashboardUserGrowth; loading: boolean; error: boolean; onRetry: () => void }) => (
  <DashboardChartCard
    title="User Growth"
    subtitle="Cumulative user accounts from real signups"
    metric={data ? count(data.totalUsers) : '-'}
    change={data?.changePercentage ?? 0}
    points={data?.points || []}
    valueKey="cumulativeUsers"
    loading={loading}
    error={error}
    onRetry={onRetry}
    icon={Users}
  />
);

const SystemHealthPanel = ({ data, loading, error, onRetry }: { data?: AdminDashboardSystemHealth; loading: boolean; error: boolean; onRetry: () => void }) => {
  const items = [
    { label: 'API Services', value: data?.api },
    { label: 'Database', value: data?.database },
    { label: 'Storage', value: data?.storage },
    { label: 'Background Jobs', value: data?.jobs },
  ];
  const allKnownUp = items.every(item => item.value === 'UP');
  const hasUnknown = items.some(item => !item.value || item.value === 'UNKNOWN');

  return (
    <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">System Health</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {data?.lastCheckedAt ? `Last checked ${formatDateTime(data.lastCheckedAt)}` : 'Dashboard-safe service status'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${
          error
            ? 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20'
            : allKnownUp
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20'
              : 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20'
        }`}>
          {error || hasUnknown ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {error ? 'Health unavailable' : hasUnknown ? 'Partially monitored' : 'Operational'}
        </span>
      </div>
      {loading ? (
        <StateBlock variant="loading" title="Loading health" description="Checking dashboard-safe service status." className="mt-4 border-0 bg-slate-50 shadow-none dark:bg-slate-950/40" />
      ) : error ? (
        <StateBlock variant="error" title="Health unavailable" description="System health could not be loaded." actionLabel="Retry" onAction={onRetry} className="mt-4 border-0 bg-slate-50 shadow-none dark:bg-slate-950/40" />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map(item => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                {item.value === 'UP' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{item.label}</p>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{item.value || 'UNKNOWN'}</p>
            </div>
          ))}
        </div>
      )}
    </MotionDiv>
  );
};

const RecentBookingsPanel = ({ bookings, loading, error, onRetry }: { bookings: AdminDashboardRecentBooking[]; loading: boolean; error: boolean; onRetry: () => void }) => (
  <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">Recent Bookings</h2>
      <span className="text-sm font-black text-slate-400">Live feed</span>
    </div>
    {loading ? (
      <StateBlock variant="loading" title="Loading bookings" description="Fetching recent booking activity." className="mt-5 border-0 bg-slate-50 shadow-none dark:bg-slate-950/40" />
    ) : error ? (
      <StateBlock variant="error" title="Bookings unavailable" description="Recent bookings could not be loaded." actionLabel="Retry" onAction={onRetry} className="mt-5 border-0 bg-slate-50 shadow-none dark:bg-slate-950/40" />
    ) : bookings.length > 0 ? (
      <div className="mt-5 space-y-3">
        {bookings.map(booking => (
          <div key={booking.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/60 dark:bg-slate-950/40">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">{booking.listingTitle}</p>
              <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{booking.customerName} · {booking.bookingNumber}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-black text-slate-700 dark:text-slate-200">{money(Number(booking.total || 0), booking.currency || 'VND')}</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase text-slate-400">{booking.status}</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <StateBlock
        title="No bookings yet"
        description="Recent bookings will appear here when customers start placing marketplace orders."
        className="mt-5 border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40"
      />
    )}
  </MotionDiv>
);

const TopListingsPanel = ({ listings, loading }: { listings: ListingResponse[]; loading: boolean }) => (
  <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">Top Listings</h2>
      <Link to="/search" className="text-sm font-black text-blue-600 hover:text-blue-700">View all</Link>
    </div>
    {loading ? (
      <StateBlock variant="loading" title="Loading listings" description="Fetching active marketplace listings." className="mt-5 border-0 bg-slate-50 shadow-none dark:bg-slate-950/40" />
    ) : listings.length > 0 ? (
      <div className="mt-5 space-y-3">
        {listings.map((listing, index) => <TopListingRow key={listing.id} listing={listing} rank={index + 1} />)}
      </div>
    ) : (
      <StateBlock title="No active listings" description="Top listings will appear when active marketplace listings exist." className="mt-5 border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40" />
    )}
  </MotionDiv>
);

const TopListingRow = ({ listing, rank }: { listing: ListingResponse; rank: number }) => (
  <Link to={`/listings/${listing.slug}`} className="flex min-w-0 items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/80">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{rank}</span>
    {listing.coverImageUrl ? (
      <img src={listing.coverImageUrl} alt={listing.title} className="h-12 w-16 shrink-0 rounded-xl object-cover" />
    ) : (
      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Store className="h-5 w-5" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="line-clamp-1 text-sm font-black text-slate-950 dark:text-slate-50">{listing.title}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{money(listing.basePrice, listing.currency)} / {formatCategory(listing.category)}</p>
    </div>
    <span className="hidden shrink-0 items-center gap-1 text-sm font-black text-slate-800 dark:text-slate-200 sm:inline-flex">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      {listing.averageRating?.toFixed(1) || 'New'}
    </span>
  </Link>
);

const QuickActionsPanel = () => {
  const actions = [
    { label: 'Add New Listing', icon: Store, to: '/provider/listings/new', available: true },
    { label: 'Verify Provider', icon: ShieldCheck, to: '/admin/providers', available: true },
    { label: 'View Reports', icon: FileBarChart, available: false },
    { label: 'Manage Users', icon: Users, to: '/admin/users', available: true },
    { label: 'System Settings', icon: Settings, available: false },
  ];

  return (
    <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 min-[1280px]:col-span-2 min-[1440px]:col-span-1">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">Quick Actions</h2>
      <div className="mt-5 space-y-3">
        {actions.map(action => <QuickAction key={action.label} {...action} />)}
      </div>
    </MotionDiv>
  );
};

const QuickAction = ({ label, icon: Icon, to, available }: { label: string; icon: React.ElementType; to?: string; available: boolean }) => {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-800 dark:text-slate-200">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </>
  );

  if (available && to) {
    return <Link to={to} className="flex min-h-[58px] min-w-0 items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-950/40 dark:hover:border-blue-400/30 dark:hover:bg-blue-500/10">{content}</Link>;
  }

  return (
    <button type="button" disabled title="No admin route/API is currently wired for this action." className="flex min-h-[58px] min-w-0 items-center gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 opacity-70 dark:border-slate-700/60 dark:bg-slate-950/40">
      {content}
    </button>
  );
};

const AdminDataNotice = ({ catalogValue, currency, activeListings, generatedAt }: { catalogValue: number; currency: string; activeListings: number; generatedAt?: string }) => (
  <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm dark:border-blue-400/20 dark:from-blue-500/15 dark:via-slate-900 dark:to-cyan-500/10">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
      <Sparkles className="h-6 w-6" />
    </div>
    <h3 className="mt-4 text-base font-black text-slate-950 dark:text-slate-50">Dashboard data scope</h3>
    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
      KPI cards, booking trends, user growth, recent bookings, and safe health checks are loaded from admin-only aggregate APIs.
    </p>
    <div className="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-blue-100 dark:bg-slate-950/50 dark:ring-blue-400/20">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Top listings sample</p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-slate-50">{activeListings.toLocaleString()} active listings</p>
      <p className="text-sm font-black text-blue-700 dark:text-blue-300">{money(catalogValue, currency)} loaded page value</p>
      {generatedAt && <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">Overview generated {formatDateTime(generatedAt)}</p>}
    </div>
  </MotionDiv>
);
