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
import { useAuth } from '@/context/AuthContext';
import { StateBlock } from '@/components/ui/StateBlock';
import { ListingResponse } from '@/types/listing';
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
  { label: 'Users', icon: Users, group: 'management' },
  { label: 'Providers', icon: HeartHandshake, group: 'management' },
  { label: 'Listings', icon: Store, group: 'management' },
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
  const profileRef = React.useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-active-listings'],
    queryFn: () => listingService.searchListings({ status: 'ACTIVE', page: 0, size: 8 }),
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

  const listings = data?.data?.content || [];
  const totalActiveListings = data?.data?.totalElements ?? listings.length;
  const catalogValue = listings.reduce((sum, listing) => sum + (listing.basePrice || 0), 0);
  const currency = listings[0]?.currency || 'VND';
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
      <div className="flex min-h-screen bg-[#f7f9fc] text-slate-950 transition-colors duration-200 dark:bg-[#07111f] dark:text-slate-50">
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm xl:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <AdminSidebar onLogout={handleLogout} drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800 dark:bg-[#081321]/92">
          <div className="flex h-20 items-center justify-between gap-3 px-4 md:px-6 2xl:px-8">
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

            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <button className="hidden h-11 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 shadow-sm transition hover:border-blue-100 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-blue-400/40 md:flex lg:w-80">
                <Search className="h-4 w-4 shrink-0" />
                <span className="truncate">Search anything...</span>
                <span className="ml-auto rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-400 dark:bg-slate-800 dark:text-slate-500">⌘K</span>
              </button>
              <IconButton icon={Search} label="Search" className="md:hidden" />
              <IconButton icon={Bell} label="Notifications" badge="!" />
              <IconButton icon={MessageSquare} label="Messages" />
              <ThemeToggle />
              <div ref={profileRef} className="relative">
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
          <MotionDiv className="mx-auto w-full max-w-none space-y-6" {...animationProps}>
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

            <MotionDiv variants={containerVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              <KpiCard title="Total Users" value="Unavailable" helper="No admin users API" icon={Users} tone="blue" />
              <KpiCard title="Active Listings" value={isLoading ? '...' : totalActiveListings.toLocaleString()} helper="From public listings API" icon={Store} tone="emerald" />
              <KpiCard title="Total Bookings" value="Unavailable" helper="No admin bookings API" icon={CalendarCheck} tone="amber" />
              <KpiCard title="Total Revenue" value="Unavailable" helper="No admin revenue API" icon={CreditCard} tone="violet" />
              <KpiCard title="Total Providers" value="Unavailable" helper="No admin providers API" icon={ShieldCheck} tone="blue" className="sm:col-span-2 lg:col-span-1" />
            </MotionDiv>

            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 space-y-6">
                <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                  <ChartPlaceholder title="Bookings Overview" description="No admin booking time-series endpoint is exposed." icon={CalendarCheck} />
                  <ChartPlaceholder title="User Growth" description="No admin user-growth endpoint is exposed." icon={Users} />
                </div>

                <SystemHealthPanel />

                <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                  <RecentBookingsPanel />
                  <TopListingsPanel listings={topListings} loading={isLoading} />
                </div>
              </div>

              <aside className="min-w-0 space-y-6">
                <QuickActionsPanel />
                <AdminDataNotice catalogValue={catalogValue} currency={currency} activeListings={totalActiveListings} />
              </aside>
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
  onClose,
  onLogout,
}: {
  drawerOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}) => {
  const location = useLocation();

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 flex w-[260px] transform flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-[#081321] dark:shadow-slate-950/40 transition-transform duration-300 ease-out xl:sticky xl:top-0 xl:translate-x-0 xl:shadow-none
      ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex h-20 items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-3" onClick={onClose}>
          <img src="/brand/ai-marketplace-traveler-logo.png" alt="AI Marketplace Traveler" className="h-12 w-auto object-contain" />
        </Link>
        <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 xl:hidden" onClick={onClose} aria-label="Close admin navigation">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {groupedNav.map(group => (
          <div key={group.label || 'main'} className="mb-5">
            {group.label && <p className="mb-2 px-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = item.to && location.pathname === item.to;
                if (item.to) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={onClose}
                      className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled
                    title="No admin route is currently wired for this feature."
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-400 opacity-75 dark:text-slate-600"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 p-4">
        <Link
          to="/"
          onClick={onClose}
          className="flex h-12 items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/20"
        >
          View Site <ExternalLink className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex h-12 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-red-600 transition hover:border-red-100 hover:bg-red-50 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-red-400 dark:hover:border-red-400/30 dark:hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5" />
          Sign out
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
  return (
    <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className={`min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:shadow-slate-950/40 ${className}`}>
      <div className="flex min-w-0 items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ${styles.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 xl:text-3xl">{value}</p>
        </div>
      </div>
      <p className={`mt-4 text-xs font-black ${styles.text}`}>{helper}</p>
    </MotionDiv>
  );
};

const ChartPlaceholder = ({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) => (
  <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Responsive chart area</p>
      </div>
      <button className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-400">Current</button>
    </div>
    <div className="mt-5 flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center dark:border-slate-700/70 dark:bg-slate-950/40">
      <Icon className="h-10 w-10 text-blue-500" />
      <h3 className="mt-3 text-base font-black text-slate-950 dark:text-slate-50">No chart data endpoint</h3>
      <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  </MotionDiv>
);

const SystemHealthPanel = () => (
  <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">System Health</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">No live health endpoint is exposed in the frontend.</p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20">
        <AlertTriangle className="h-4 w-4" />
        Monitoring unavailable
      </span>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {['API Services', 'Database', 'Storage', 'Email Service', 'Payment Gateway'].map(item => (
        <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{item}</p>
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">No live status</p>
        </div>
      ))}
    </div>
  </MotionDiv>
);

const RecentBookingsPanel = () => (
  <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">Recent Bookings</h2>
      <span className="text-sm font-black text-slate-400">No route</span>
    </div>
    <StateBlock
      title="No admin bookings feed"
      description="The current frontend exposes checkout and customer booking-related review eligibility, but no admin booking list API. No fake bookings are shown."
      className="mt-5 border-dashed bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-950/40"
    />
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
      <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{money(listing.basePrice, listing.currency)} · {formatCategory(listing.category)}</p>
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
    { label: 'Verify Provider', icon: ShieldCheck, available: false },
    { label: 'View Reports', icon: FileBarChart, available: false },
    { label: 'Manage Users', icon: Users, available: false },
    { label: 'System Settings', icon: Settings, available: false },
  ];

  return (
    <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 xl:p-6">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">Quick Actions</h2>
      <div className="mt-5 grid gap-3 min-[420px]:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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
      <span className="min-w-0 flex-1 text-sm font-black text-slate-800 dark:text-slate-200">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </>
  );

  if (available && to) {
    return <Link to={to} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-blue-100 hover:bg-blue-50/40 dark:border-slate-700/60 dark:bg-slate-950/40 dark:hover:border-blue-400/30 dark:hover:bg-blue-500/10">{content}</Link>;
  }

  return (
    <button type="button" disabled title="No admin route/API is currently wired for this action." className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 opacity-70 dark:border-slate-700/60 dark:bg-slate-950/40">
      {content}
    </button>
  );
};

const AdminDataNotice = ({ catalogValue, currency, activeListings }: { catalogValue: number; currency: string; activeListings: number }) => (
  <MotionDiv variants={itemVariants} transition={{ duration: 0.42 }} className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm dark:border-blue-400/20 dark:from-blue-500/15 dark:via-slate-900 dark:to-cyan-500/10">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
      <Sparkles className="h-6 w-6" />
    </div>
    <h3 className="mt-4 text-base font-black text-slate-950 dark:text-slate-50">Admin data scope</h3>
    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
      This dashboard uses real active listing data. Admin users, bookings, revenue, reports, audit logs, and system health require dedicated APIs before they can show production values.
    </p>
    <div className="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-blue-100 dark:bg-slate-950/50 dark:ring-blue-400/20">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Current catalog sample</p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-slate-50">{activeListings.toLocaleString()} active listings</p>
      <p className="text-sm font-black text-blue-700 dark:text-blue-300">{money(catalogValue, currency)} loaded page value</p>
    </div>
  </MotionDiv>
);
