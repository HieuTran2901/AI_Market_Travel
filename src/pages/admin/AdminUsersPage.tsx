import React from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  BadgeCheck,
  Ban,
  Bell,
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
  Eye,
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
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { AdminSidebarCollapseButton } from '@/components/admin/AdminSidebarCollapseButton';
import { AdminSidebarSectionLabel, AdminSidebarText } from '@/components/admin/AdminSidebarAnimatedText';
import { useAdminSidebarCollapse } from '@/components/admin/useAdminSidebarCollapse';
import { ThemeMenu, ThemeToggle } from '@/components/theme/ThemeControls';
import { adminUserService } from '@/services/adminUserService';
import { PageResponse } from '@/types';
import { AdminUser, AdminUserRole, AdminUserSearchParams, AdminUserStatistics, AdminUserStatus } from '@/types/adminUser';

type NavItem = {
  label: string;
  icon: React.ElementType;
  to?: string;
  group?: 'main' | 'management' | 'operations' | 'system';
};

type UserFilterState = {
  search: string;
  role: string;
  status: string;
  verified: string;
  joinedDate: string;
  pageSize: string;
  tab: string;
  page: string;
};

type UserStat = {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  tone: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose';
};

type UserModerationDialog =
  | { action: 'ban'; user: AdminUser }
  | { action: 'unban'; user: AdminUser }
  | null;

const banReasonOptions = [
  { value: 'SPAM_ABUSE', label: 'Spam or abuse' },
  { value: 'FRAUD_SUSPICIOUS_ACTIVITY', label: 'Fraud or suspicious activity' },
  { value: 'POLICY_VIOLATION', label: 'Policy violation' },
  { value: 'PAYMENT_ABUSE', label: 'Payment abuse' },
  { value: 'SECURITY_RISK', label: 'Security risk' },
  { value: 'DUPLICATE_ACCOUNT', label: 'Duplicate account' },
  { value: 'OTHER', label: 'Other' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const pageSequence = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const quickTransition = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const };

const MotionSection = motion.section;
const MotionArticle = motion.article;
const MotionDiv = motion.div;
const MotionTr = motion.tr;
const MotionButton = motion.button;
const MotionSpan = motion.span;
const MotionTbody = motion.tbody;

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

const initialFilters: UserFilterState = {
  search: '',
  role: 'all',
  status: 'all',
  verified: 'all',
  joinedDate: '',
  pageSize: '10',
  tab: 'all',
  page: '0',
};

const toneClasses: Record<UserStat['tone'], { icon: string; helper: string; value: string }> = {
  blue: {
    icon: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20',
    helper: 'text-blue-700 dark:text-blue-300',
    value: 'text-slate-950 dark:text-slate-50',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20',
    helper: 'text-emerald-700 dark:text-emerald-300',
    value: 'text-slate-950 dark:text-slate-50',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20',
    helper: 'text-amber-700 dark:text-amber-300',
    value: 'text-slate-950 dark:text-slate-50',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20',
    helper: 'text-violet-700 dark:text-violet-300',
    value: 'text-slate-950 dark:text-slate-50',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20',
    helper: 'text-rose-700 dark:text-rose-300',
    value: 'text-slate-950 dark:text-slate-50',
  },
};

function initials(name?: string) {
  if (!name) return 'A';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function countActiveFilters(filters: UserFilterState) {
  return [
    filters.search.trim(),
    filters.role !== 'all',
    filters.status !== 'all',
    filters.verified !== 'all',
    filters.joinedDate,
  ].filter(Boolean).length;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

function useAnimatedNumber(value: number | undefined, loading: boolean) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = React.useState(value ?? 0);
  const animatedOnceRef = React.useRef(false);
  const displayValueRef = React.useRef(value ?? 0);

  const setDisplay = React.useCallback((nextValue: number) => {
    displayValueRef.current = nextValue;
    setDisplayValue(nextValue);
  }, []);

  React.useEffect(() => {
    if (loading || typeof value !== 'number') return;

    if (shouldReduceMotion || animatedOnceRef.current) {
      setDisplay(value);
      animatedOnceRef.current = true;
      return;
    }

    const startValue = displayValueRef.current;
    const delta = value - startValue;
    const duration = 520;
    const startTime = performance.now();
    let frame = 0;

    const tick = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValue + delta * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        animatedOnceRef.current = true;
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [loading, setDisplay, shouldReduceMotion, value]);

  return displayValue;
}

function getActiveFilterChips(filters: UserFilterState) {
  const chips: Array<{ key: keyof UserFilterState; label: string; value: string }> = [];
  if (filters.search.trim()) chips.push({ key: 'search', label: 'Search', value: filters.search.trim() });
  if (filters.role !== 'all') chips.push({ key: 'role', label: 'Role', value: filters.role });
  if (filters.status !== 'all') chips.push({ key: 'status', label: 'Status', value: filters.status });
  if (filters.verified !== 'all') chips.push({ key: 'verified', label: 'Verified', value: filters.verified });
  if (filters.joinedDate) chips.push({ key: 'joinedDate', label: 'Joined', value: filters.joinedDate });
  return chips;
}

function getInitialFilters(searchParams: URLSearchParams): UserFilterState {
  return {
    search: searchParams.get('keyword') ?? '',
    role: searchParams.get('role') ?? 'all',
    status: searchParams.get('status') ?? 'all',
    verified: searchParams.get('verified') ?? 'all',
    joinedDate: searchParams.get('joinedDate') ?? '',
    pageSize: searchParams.get('size') ?? '10',
    tab: searchParams.get('tab') ?? 'all',
    page: searchParams.get('page') ?? '0',
  };
}

function parseJoinedRange(value: string) {
  const [fromRaw, toRaw] = value.split(/\s+to\s+|\s+-\s+/i).map(part => part?.trim()).filter(Boolean);
  const toIso = (date: string | undefined, endOfDay = false) => {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return undefined;
    if (endOfDay) {
      parsed.setHours(23, 59, 59, 999);
    } else {
      parsed.setHours(0, 0, 0, 0);
    }
    return parsed.toISOString();
  };

  return {
    joinedFrom: toIso(fromRaw),
    joinedTo: toIso(toRaw ?? fromRaw, true),
  };
}

function toApiParams(filters: UserFilterState, debouncedSearch: string): AdminUserSearchParams {
  const range = parseJoinedRange(filters.joinedDate);
  const tabRole = filters.tab === 'customers' ? 'CUSTOMER' : filters.tab === 'providers' ? 'PROVIDER' : filters.tab === 'admins' ? 'ADMIN' : undefined;
  const role = filters.role !== 'all' ? filters.role.toUpperCase() as AdminUserRole : tabRole;
  const status = filters.status !== 'all' ? filters.status.toUpperCase() as AdminUserStatus : undefined;

  return {
    page: Math.max(Number(filters.page) || 0, 0),
    size: Math.min(Math.max(Number(filters.pageSize) || 10, 1), 100),
    sort: 'createdAt,desc',
    keyword: debouncedSearch.trim() || undefined,
    role,
    status,
    verified: filters.verified === 'verified' ? true : filters.verified === 'unverified' ? false : undefined,
    ...range,
  };
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? value.toLocaleString() : '-';
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatRelative(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(Math.floor(diffMs / 60000), 0);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function getApiErrorMessage(error: unknown, fallback = 'Unable to update user account.') {
  if (error && typeof error === 'object') {
    const maybe = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
    const responseMessage = maybe.response?.data?.message ?? maybe.response?.data?.error;
    if (responseMessage) return responseMessage;
    if (maybe.message) return maybe.message;
  }
  return fallback;
}

export const AdminUsersPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const { collapsed: sidebarCollapsed, compact: sidebarCompact, labelsHidden: sidebarLabelsHidden, transitioning: sidebarTransitioning, toggle: toggleSidebarCollapsed } = useAdminSidebarCollapse();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState<UserFilterState>(() => getInitialFilters(searchParams));
  const [actionMenuUserId, setActionMenuUserId] = React.useState<number | null>(null);
  const [moderationDialog, setModerationDialog] = React.useState<UserModerationDialog>(null);
  const [banReasonCode, setBanReasonCode] = React.useState('');
  const [banReason, setBanReason] = React.useState('');
  const [internalNote, setInternalNote] = React.useState('');
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [mutationMessage, setMutationMessage] = React.useState<string | null>(null);
  const profileRef = React.useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adminName = user?.fullName || user?.email || 'Administrator';
  const activeFilters = countActiveFilters(filters);
  const debouncedSearch = useDebouncedValue(filters.search, 400);
  const userQueryParams = React.useMemo(() => toApiParams(filters, debouncedSearch), [filters, debouncedSearch]);

  const usersQuery = useQuery({
    queryKey: ['admin-users', userQueryParams],
    queryFn: () => adminUserService.getUsers(userQueryParams),
    staleTime: 30_000,
  });

  const statisticsQuery = useQuery({
    queryKey: ['admin-users-statistics'],
    queryFn: () => adminUserService.getStatistics(),
    staleTime: 60_000,
  });

  const usersPage = usersQuery.data?.data;
  const statistics = statisticsQuery.data?.data;

  const moderationMutation = useMutation({
    mutationFn: ({ action, targetUser, reasonCode, reason, note }: { action: 'ban' | 'unban'; targetUser: AdminUser; reasonCode?: string; reason?: string; note?: string }) => {
      if (action === 'ban') {
        return adminUserService.banUser(targetUser.id, {
          reasonCode: reasonCode ?? '',
          reason: reason ?? '',
          internalNote: note,
        });
      }
      return adminUserService.unbanUser(targetUser.id);
    },
    onSuccess: response => {
      setMutationMessage(response.message || 'User account updated.');
      setModerationDialog(null);
      setDialogError(null);
      setActionMenuUserId(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users-statistics'] });
      window.setTimeout(() => setMutationMessage(null), 2400);
    },
    onError: error => {
      const message = getApiErrorMessage(error);
      setDialogError(message);
      setMutationMessage(message);
      window.setTimeout(() => setMutationMessage(null), 2800);
    },
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

  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-action-menu]')) setActionMenuUserId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !moderationMutation.isPending) {
        setActionMenuUserId(null);
        setModerationDialog(null);
        setDialogError(null);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [moderationMutation.isPending]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (filters.search.trim()) next.set('keyword', filters.search.trim());
    if (filters.role !== 'all') next.set('role', filters.role);
    if (filters.status !== 'all') next.set('status', filters.status);
    if (filters.verified !== 'all') next.set('verified', filters.verified);
    if (filters.joinedDate) next.set('joinedDate', filters.joinedDate);
    if (filters.pageSize !== '10') next.set('size', filters.pageSize);
    if (filters.tab !== 'all') next.set('tab', filters.tab);
    if (filters.page !== '0') next.set('page', filters.page);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  const updateFilter = <K extends keyof UserFilterState>(key: K, value: UserFilterState[K]) => {
    setFilters(current => ({
      ...current,
      [key]: value,
      page: key === 'page' ? String(value) : '0',
    }));
  };

  const openModerationDialog = (targetUser: AdminUser, action: 'ban' | 'unban') => {
    setActionMenuUserId(null);
    setModerationDialog({ action, user: targetUser });
    setBanReasonCode('');
    setBanReason('');
    setInternalNote('');
    setDialogError(null);
  };

  const closeModerationDialog = () => {
    if (moderationMutation.isPending) return;
    setModerationDialog(null);
    setDialogError(null);
  };

  const submitModeration = () => {
    if (!moderationDialog || moderationMutation.isPending) return;
    if (moderationDialog.action === 'ban') {
      const reasonCode = banReasonCode.trim();
      const reason = banReason.trim();
      const note = internalNote.trim();
      if (!reasonCode) {
        setDialogError('Please choose a ban reason category.');
        return;
      }
      if (!reason) {
        setDialogError('Please enter a ban reason.');
        return;
      }
      if (reasonCode === 'OTHER' && !note) {
        setDialogError('Please add an internal note when using Other.');
        return;
      }
      moderationMutation.mutate({ action: 'ban', targetUser: moderationDialog.user, reasonCode, reason, note });
      return;
    }
    moderationMutation.mutate({ action: 'unban', targetUser: moderationDialog.user });
  };

  return (
    <MotionConfig reducedMotion="user">
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

        <AdminUsersSidebar drawerOpen={drawerOpen} collapsed={sidebarCompact} labelsHidden={sidebarLabelsHidden} toggleDisabled={sidebarTransitioning} toggleCollapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebarCollapsed} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />

        <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCompact ? 'xl:pl-[80px]' : 'xl:pl-[240px]'}`}>
          <AdminUsersHeader
            adminName={adminName}
            drawerOpen={drawerOpen}
            onOpenDrawer={() => setDrawerOpen(true)}
            onLogout={handleLogout}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
            profileRef={profileRef}
            avatarUrl={user?.avatarUrl}
          />

          <main className="min-w-0 flex-1 px-4 py-5 md:px-6 2xl:px-8">
            <MotionDiv
              className="mx-auto w-full max-w-[1680px] min-w-0 space-y-5 px-0 py-0"
              variants={pageSequence}
              initial="hidden"
              animate="visible"
            >
              <MotionDiv variants={fadeUp} transition={quickTransition}><PageActions /></MotionDiv>
              <MotionDiv variants={fadeUp} transition={quickTransition}><UserCommunityBanner /></MotionDiv>
              <MotionDiv variants={fadeUp} transition={quickTransition}>
                <UserStatsGrid statistics={statistics} loading={statisticsQuery.isLoading} error={statisticsQuery.isError} onRetry={() => statisticsQuery.refetch()} />
              </MotionDiv>
              <MotionDiv variants={fadeUp} transition={quickTransition}>
                <UserFilters filters={filters} activeFilters={activeFilters} onChange={updateFilter} onClear={() => setFilters(initialFilters)} />
              </MotionDiv>
              {mutationMessage && <MotionDiv variants={fadeUp} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 shadow-sm dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">{mutationMessage}</MotionDiv>}
              <MotionDiv variants={fadeUp} transition={quickTransition}>
                <UsersTable
                filters={filters}
                activeFilters={activeFilters}
                users={usersPage?.content ?? []}
                page={usersPage}
                loading={usersQuery.isLoading || usersQuery.isFetching}
                error={usersQuery.isError}
                onRetry={() => usersQuery.refetch()}
                onChange={updateFilter}
                currentUserId={user?.id}
                actionMenuUserId={actionMenuUserId}
                actionLoadingId={moderationMutation.variables?.targetUser.id}
                onToggleActionMenu={setActionMenuUserId}
                onModerate={openModerationDialog}
              />
              </MotionDiv>
              <UserModerationDialog
                state={moderationDialog}
                reasonCode={banReasonCode}
                reason={banReason}
                internalNote={internalNote}
                error={dialogError}
                submitting={moderationMutation.isPending}
                onReasonCodeChange={setBanReasonCode}
                onReasonChange={setBanReason}
                onInternalNoteChange={setInternalNote}
                onClose={closeModerationDialog}
                onSubmit={submitModeration}
              />
              <UserAnalyticsGrid statistics={statistics} users={usersPage?.content ?? []} loading={statisticsQuery.isLoading || usersQuery.isLoading} />
            </MotionDiv>
          </main>
        </div>
        </div>
      </div>
    </MotionConfig>
  );
};

const AdminUsersHeader = ({
  adminName,
  onOpenDrawer,
  onLogout,
  profileOpen,
  setProfileOpen,
  profileRef,
  avatarUrl,
}: {
  adminName: string;
  drawerOpen: boolean;
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
        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
          onClick={onOpenDrawer}
          aria-label="Open admin navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight text-blue-600 md:text-2xl">Users</h1>
          <div className="mt-1 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:flex">
            <Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Users</span>
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
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen(open => !open)}
            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/60 dark:border-slate-700/70 dark:bg-slate-900/80 dark:hover:border-blue-400/40"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={adminName} className="h-10 w-10 rounded-full object-cover" />
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
                  onClick={onLogout}
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
);

const AdminUsersSidebar = ({
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
      fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 transform flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-200/70 [height:100dvh] transition-[width,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-slate-800 dark:bg-[#081321] dark:shadow-slate-950/40 xl:z-40 xl:translate-x-0 xl:shadow-none ${collapsed ? 'xl:w-[80px]' : 'xl:w-[240px]'}
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

const HeaderIconButton = ({ icon: Icon, label, badge, className = '' }: { icon: React.ElementType; label: string; badge?: string; className?: string }) => (
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

const PageActions = () => (
  <section className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">Users</h2>
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled
        title="No admin user creation endpoint is currently available."
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition duration-150 enabled:hover:-translate-y-0.5 enabled:hover:bg-blue-700 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Plus className="h-4 w-4" />
        Add User
      </button>
      <button
        type="button"
        disabled
        title="Export requires an admin users endpoint."
        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition duration-150 enabled:hover:-translate-y-0.5 enabled:hover:border-blue-200 enabled:hover:text-blue-700 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200"
      >
        <Download className="h-4 w-4" />
        Export
      </button>
    </div>
  </section>
);

const UserCommunityBanner = () => {
  const indicators = [
    { label: 'Secure', text: 'Advanced verification', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 ring-blue-100' },
    { label: 'Reliable', text: 'Active user monitoring', icon: Sparkles, color: 'text-cyan-600 bg-cyan-50 ring-cyan-100' },
    { label: 'Engaged', text: 'Growing every day', icon: Users, color: 'text-violet-600 bg-violet-50 ring-violet-100' },
    { label: 'Protected', text: 'Anti-fraud system', icon: LockKeyhole, color: 'text-indigo-600 bg-indigo-50 ring-indigo-100' },
  ];

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="grid min-w-0 gap-5 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:items-center">
        <div className="relative min-h-[116px] overflow-hidden rounded-[20px] bg-gradient-to-br from-blue-50 via-indigo-50/70 to-white p-5 dark:from-blue-500/15 dark:via-indigo-500/10 dark:to-slate-900">
          <div className="relative z-10 flex min-w-0 items-center gap-4">
            <MotionDiv initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ ...quickTransition, delay: 0.06 }}>
              <CommunityIllustration />
            </MotionDiv>
            <MotionDiv className="min-w-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...quickTransition, delay: 0.12 }}>
              <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">Build a trusted community</h3>
              <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">
                Monitor user activity, verify accounts, and keep your marketplace safe.
              </p>
            </MotionDiv>
          </div>
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-200/35 blur-2xl" />
        </div>
        <MotionDiv className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4" variants={pageSequence} initial="hidden" animate="visible">
          {indicators.map(item => {
            const Icon = item.icon;
            return (
              <MotionDiv
                key={item.label}
                variants={fadeUp}
                transition={quickTransition}
                whileHover={{ backgroundColor: 'rgba(248,250,252,0.95)' }}
                className="group flex min-w-0 items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition duration-200 group-hover:-translate-y-0.5 ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">{item.label}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{item.text}</p>
                </div>
              </MotionDiv>
            );
          })}
        </MotionDiv>
      </div>
    </section>
  );
};

const CommunityIllustration = () => (
  <div className="relative flex h-20 w-28 shrink-0 items-center justify-center" aria-hidden="true">
    <div className="absolute left-1 top-3 h-12 w-12 rounded-full bg-blue-100" />
    <div className="absolute right-2 top-1 h-14 w-14 rounded-full bg-indigo-100" />
    <div className="relative z-10 h-16 w-20 rounded-[20px] border border-blue-200 bg-white shadow-sm">
      <div className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <UserCheck className="h-5 w-5" />
      </div>
      <div className="mx-auto mt-2 h-1.5 w-11 rounded-full bg-blue-100" />
    </div>
    <span className="absolute bottom-1 left-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white">
      <CheckCircle2 className="h-4 w-4" />
    </span>
    <span className="absolute bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 ring-4 ring-white">
      <BadgeCheck className="h-4 w-4" />
    </span>
  </div>
);

const UserStatsGrid = ({
  statistics,
  loading,
  error,
  onRetry,
}: {
  statistics?: AdminUserStatistics;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) => {
  const stats: UserStat[] = [
    { label: 'Total Users', value: formatNumber(statistics?.totalUsers), helper: 'All marketplace accounts', icon: Users, tone: 'blue' },
    { label: 'Active Users', value: formatNumber(statistics?.activeUsers), helper: 'Currently enabled accounts', icon: UserCheck, tone: 'emerald' },
    { label: 'New Users (30d)', value: formatNumber(statistics?.newUsersLast30Days), helper: 'Joined in the last 30 days', icon: UserPlus, tone: 'amber' },
    { label: 'Verified Users', value: formatNumber(statistics?.verifiedUsers), helper: 'Approved providers and admins', icon: BadgeCheck, tone: 'violet' },
    { label: 'Banned Users', value: formatNumber(statistics?.bannedUsers), helper: 'No banned-user field exists yet', icon: Ban, tone: 'rose' },
  ];

  if (error) {
    return (
      <section className="rounded-[22px] border border-red-100 bg-red-50/70 p-5 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Unable to load user statistics.</span>
          <button type="button" onClick={onRetry} className="h-10 rounded-2xl bg-white px-4 text-sm font-black text-red-700 shadow-sm dark:bg-slate-900 dark:text-red-300">Retry</button>
        </div>
      </section>
    );
  }

  return (
    <MotionSection className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5" variants={pageSequence} initial="hidden" animate="visible">
      {stats.map(stat => <UserStatCard key={stat.label} stat={stat} loading={loading} />)}
    </MotionSection>
  );
};

const UserStatCard = ({ stat, loading }: { stat: UserStat; loading: boolean }) => {
  const Icon = stat.icon;
  const styles = toneClasses[stat.tone];
  const numericValue = Number(stat.value.replace(/,/g, ''));
  const canAnimateValue = Number.isFinite(numericValue);
  const animatedValue = useAnimatedNumber(canAnimateValue ? numericValue : undefined, loading);
  return (
    <MotionArticle
      variants={fadeUp}
      transition={quickTransition}
      whileHover={{ y: -3 }}
      className="flex min-h-[132px] min-w-0 items-center gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition-colors duration-200 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/70 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:border-blue-400/30 dark:hover:shadow-slate-950/40"
    >
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 ${styles.icon}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
        <div className="mt-2 h-8 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <MotionDiv key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-8 w-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ) : (
              <MotionDiv key="value" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className={`truncate whitespace-nowrap text-[28px] font-black leading-tight tracking-tight ${styles.value}`}>{canAnimateValue ? animatedValue.toLocaleString() : stat.value}</p>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
        <p className={`mt-2 line-clamp-1 text-xs font-black ${styles.helper}`}>{loading ? 'Loading...' : stat.helper}</p>
      </div>
    </MotionArticle>
  );
};

const UserFilters = ({
  filters,
  activeFilters,
  onChange,
  onClear,
}: {
  filters: UserFilterState;
  activeFilters: number;
  onChange: <K extends keyof UserFilterState>(key: K, value: UserFilterState[K]) => void;
  onClear: () => void;
}) => {
  const chips = getActiveFilterChips(filters);
  const resetValue = (key: keyof UserFilterState) => {
    onChange(key, key === 'search' || key === 'joinedDate' ? '' : 'all');
  };

  return (
  <section className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
    <div className="grid min-w-0 gap-3 lg:grid-cols-2 xl:[grid-template-columns:minmax(260px,1.5fr)_repeat(4,minmax(140px,0.65fr))_auto]">
      <label className="relative min-w-0">
        <span className="sr-only">Search users</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={event => onChange('search', event.target.value)}
          placeholder="Search by name, email, or phone..."
          className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200 dark:focus:ring-blue-400/20"
        />
      </label>
      <FilterSelect label="Role" value={filters.role} onChange={value => onChange('role', value)} options={['All Roles', 'Customer', 'Provider', 'Admin']} />
      <FilterSelect label="Status" value={filters.status} onChange={value => onChange('status', value)} options={['All Statuses', 'Active', 'Inactive', 'Suspended', 'Banned']} />
      <FilterSelect label="Verified" value={filters.verified} onChange={value => onChange('verified', value)} options={['All', 'Verified', 'Unverified']} />
      <label className="relative min-w-0">
        <span className="sr-only">Joined date range</span>
        <Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.joinedDate}
          onChange={event => onChange('joinedDate', event.target.value)}
          placeholder="Joined date range"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200 dark:focus:ring-blue-400/20"
        />
      </label>
      <button
        type="button"
        disabled={activeFilters === 0}
        onClick={onClear}
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-blue-300 dark:hover:bg-blue-500/10 dark:disabled:text-slate-600"
      >
        <X className="h-4 w-4" />
        Clear filters
      </button>
    </div>
    <AnimatePresence initial={false}>
      {chips.length > 0 && (
        <MotionDiv
          className="mt-3 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {chips.map(chip => (
            <MotionButton
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() => resetValue(chip.key)}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.16 }}
              className="inline-flex h-8 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300"
            >
              <span className="text-blue-500">{chip.label}:</span>
              <span className="max-w-[180px] truncate">{chip.value}</span>
              <X className="h-3.5 w-3.5" />
            </MotionButton>
          ))}
        </MotionDiv>
      )}
    </AnimatePresence>
  </section>
  );
};

const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
  <label className="min-w-0">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200 dark:focus:ring-blue-400/20"
    >
      {options.map((option, index) => (
              <option key={option} value={index === 0 ? 'all' : option.toLowerCase().replace(/\s+/g, '-')}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const UsersTable = ({
  filters,
  activeFilters,
  users,
  page,
  loading,
  error,
  onRetry,
  onChange,
  currentUserId,
  actionMenuUserId,
  actionLoadingId,
  onToggleActionMenu,
  onModerate,
}: {
  filters: UserFilterState;
  activeFilters: number;
  users: AdminUser[];
  page?: PageResponse<AdminUser>;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onChange: <K extends keyof UserFilterState>(key: K, value: UserFilterState[K]) => void;
  currentUserId?: number;
  actionMenuUserId: number | null;
  actionLoadingId?: number;
  onToggleActionMenu: (userId: number | null) => void;
  onModerate: (user: AdminUser, action: 'ban' | 'unban') => void;
}) => {
  const tabs = [
    { key: 'all', label: 'All Users', count: page?.totalElements ?? 0 },
    { key: 'customers', label: 'Customers' },
    { key: 'providers', label: 'Providers' },
    { key: 'admins', label: 'Admins' },
  ];
  const total = page?.totalElements ?? 0;
  const pageNumber = page?.number ?? Number(filters.page) ?? 0;
  const pageSize = page?.size ?? Number(filters.pageSize) ?? 10;
  const totalPages = page?.totalPages ?? 1;
  const start = total === 0 ? 0 : pageNumber * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + users.length - 1, total);

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="flex min-w-0 flex-col gap-4 border-b border-slate-200/80 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange('tab', tab.key)}
              className={`relative shrink-0 overflow-hidden rounded-2xl px-4 py-2 text-sm font-black transition active:scale-[0.98] ${
                filters.tab === tab.key ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {filters.tab === tab.key && (
                <MotionDiv
                  layoutId="admin-users-active-tab"
                  className="absolute inset-0 rounded-2xl bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:ring-blue-400/20"
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <MotionSpan
                key={filters.tab}
                className="relative z-10 inline-flex"
                initial={{ opacity: 0.65, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
              >
                {tab.label} <span className="ml-1 text-xs opacity-70">({index === 0 ? (tab.count ?? 0).toLocaleString() : '-'})</span>
              </MotionSpan>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton icon={Columns3} label="Columns" />
          <ToolbarButton icon={Filter} label="Filters" badge={activeFilters} />
          <label className="min-w-[130px]">
            <span className="sr-only">Page size</span>
            <select
              value={filters.pageSize}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300"
              onChange={event => onChange('pageSize', event.target.value)}
              disabled={loading}
            >
              {['10', '20', '50', '100'].map(size => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[44px]" />
            <col />
            <col className="w-[130px]" />
            <col className="w-[130px]" />
            <col className="w-[130px]" />
            <col className="w-[150px]" />
            <col className="w-[150px]" />
            <col className="w-[100px]" />
            <col className="w-[140px]" />
          </colgroup>
          <thead className="bg-slate-50/90 text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
            <tr>
              <th className="w-12 px-5 py-4"><input type="checkbox" disabled className="h-4 w-4 rounded border-slate-300" aria-label="Select all users" /></th>
              <th className="px-4 py-4">User</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Verified</th>
              <th className="px-4 py-4">Joined Date</th>
              <th className="px-4 py-4">Last Active</th>
              <th className="px-3 py-4 text-center">Bookings</th>
              <th className="px-3 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <MotionTbody
            key={`${loading}-${error}-${pageNumber}-${filters.tab}-${users.map(user => user.id).join('-')}`}
            className="divide-y divide-slate-100 dark:divide-slate-800"
            initial={{ opacity: 0.68 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
          >
            {loading && <TableSkeletonRows />}
            {!loading && error && (
              <tr>
                <td colSpan={9} className="px-5 py-12">
                  <TableState
                    icon={UserX}
                    title="Unable to load users"
                    description="The admin users API could not be reached. Check your session or retry the request."
                    action={<button type="button" onClick={onRetry} className="mt-4 h-10 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">Retry</button>}
                  />
                </td>
              </tr>
            )}
            {!loading && !error && users.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-12">
                  <TableState
                    icon={Users}
                    title="No users found"
                    description={activeFilters > 0 ? 'Try clearing filters or broadening your search.' : 'No marketplace users are available yet.'}
                  />
                </td>
              </tr>
            )}
            {!loading && !error && users.map((adminUser, index) => (
              <UserTableRow
                key={adminUser.id}
                user={adminUser}
                index={index}
                currentUserId={currentUserId}
                menuOpen={actionMenuUserId === adminUser.id}
                actionLoading={actionLoadingId === adminUser.id}
                onToggleMenu={() => onToggleActionMenu(actionMenuUserId === adminUser.id ? null : adminUser.id)}
                onModerate={onModerate}
              />
            ))}
          </MotionTbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200/80 px-5 py-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>Showing {start.toLocaleString()} to {end.toLocaleString()} of {total.toLocaleString()} users</span>
        <div className="flex items-center gap-1">
          <PaginationButton icon={ChevronLeft} disabled={loading || pageNumber <= 0} onClick={() => onChange('page', String(pageNumber - 1))} />
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
            const pageIndex = index;
            return (
              <button
                key={pageIndex}
                type="button"
                disabled={loading}
                onClick={() => onChange('page', String(pageIndex))}
                className={`relative h-9 min-w-9 overflow-hidden rounded-xl px-3 text-sm font-black transition active:scale-[0.97] ${pageIndex === pageNumber ? 'text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300'}`}
              >
                {pageIndex === pageNumber && <MotionDiv layoutId="admin-users-active-page" className="absolute inset-0 rounded-xl bg-blue-600" transition={{ duration: 0.18 }} />}
                <span className="relative z-10">{pageIndex + 1}</span>
              </button>
            );
          })}
          {totalPages > 5 && <span className="px-2 text-slate-400">...</span>}
          <PaginationButton icon={ChevronRight} disabled={loading || pageNumber >= totalPages - 1} onClick={() => onChange('page', String(pageNumber + 1))} />
        </div>
      </div>
    </section>
  );
};

const UserTableRow = ({
  user,
  index,
  currentUserId,
  menuOpen,
  actionLoading,
  onToggleMenu,
  onModerate,
}: {
  user: AdminUser;
  index: number;
  currentUserId?: number;
  menuOpen: boolean;
  actionLoading: boolean;
  onToggleMenu: () => void;
  onModerate: (user: AdminUser, action: 'ban' | 'unban') => void;
}) => {
  const isBanned = user.status === 'BANNED' || user.banned;
  const isSelf = currentUserId === user.id;
  return (
  <MotionTr
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.18) }}
    className="group transition-colors hover:bg-blue-50/35 dark:hover:bg-blue-500/5"
  >
    <td className="w-12 px-5 py-4"><input type="checkbox" className="h-4 w-4 rounded border-slate-300" aria-label={`Select ${user.fullName}`} /></td>
    <td className="px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.fullName} className="h-11 w-11 shrink-0 rounded-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-black text-blue-700 transition-transform duration-200 group-hover:scale-[1.03] dark:from-blue-500/20 dark:to-cyan-500/15 dark:text-blue-200">{initials(user.fullName)}</span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">{user.fullName}</p>
          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{user.email}</p>
          <p className="truncate text-xs font-semibold text-slate-400 dark:text-slate-500">{user.phone || 'No phone'}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-4"><RoleBadge role={user.primaryRole} /></td>
    <td className="px-4 py-4"><StatusBadge status={user.status} /></td>
    <td className="px-4 py-4"><VerifiedBadge verified={user.verified} /></td>
    <td className="px-4 py-4 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">{formatDateTime(user.createdAt)}</td>
    <td className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">{formatRelative(user.lastActiveAt)}</td>
    <td className="px-3 py-4 text-center align-middle text-sm font-black text-slate-800 dark:text-slate-200">
      <div className="flex w-full items-center justify-center tabular-nums">
        {(Number(user.bookingCount) || 0).toLocaleString()}
      </div>
    </td>
    <td className="px-3 py-4 align-middle">
      <div className="relative flex items-center justify-center gap-1.5 whitespace-nowrap" data-user-action-menu>
        <ActionIcon icon={Eye} label="View user" />
        {!isBanned && <ActionIcon icon={Pencil} label="Edit user" />}
        <button
          type="button"
          aria-label="More user actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={actionLoading}
          onClick={onToggleMenu}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 opacity-80 transition duration-150 hover:-translate-y-px hover:bg-blue-50 hover:text-blue-700 hover:opacity-100 active:scale-[0.97] disabled:cursor-wait disabled:opacity-50 group-hover:text-slate-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 dark:group-hover:text-slate-300"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <MotionDiv
              role="menu"
              initial={{ opacity: 0, scale: 0.97, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40"
            >
              {isBanned ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onModerate(user, 'unban')}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                >
                  <UserCheck className="h-4 w-4" />
                  Unban user
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isSelf}
                  title={isSelf ? 'You cannot ban your own account.' : undefined}
                  onClick={() => onModerate(user, 'ban')}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <Ban className="h-4 w-4" />
                  Ban user
                </button>
              )}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </td>
  </MotionTr>
  );
};

const TableSkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, index) => (
      <tr key={index}>
        <td className="px-5 py-4"><div className="h-4 w-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /></td>
        <td className="px-4 py-4"><div className="h-11 w-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" /></td>
        {Array.from({ length: 7 }).map((__, cellIndex) => (
          <td key={cellIndex} className={`px-4 py-4 ${cellIndex >= 5 ? 'text-center align-middle' : ''}`}>
            <div className={`h-7 w-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 ${cellIndex >= 5 ? 'mx-auto' : ''}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const UserModerationDialog = ({
  state,
  reasonCode,
  reason,
  internalNote,
  error,
  submitting,
  onReasonCodeChange,
  onReasonChange,
  onInternalNoteChange,
  onClose,
  onSubmit,
}: {
  state: UserModerationDialog;
  reasonCode: string;
  reason: string;
  internalNote: string;
  error: string | null;
  submitting: boolean;
  onReasonCodeChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onInternalNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) => {
  if (!state) return null;
  const isBan = state.action === 'ban';
  const title = isBan ? 'Ban user account' : 'Restore user access';
  const description = isBan
    ? 'This prevents the user from signing in and using protected marketplace features.'
    : 'This removes the ban metadata and restores access based on the account status.';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="user-moderation-title">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className={`border-b px-5 py-4 ${isBan ? 'border-rose-100 bg-rose-50/70 dark:border-rose-400/20 dark:bg-rose-500/10' : 'border-emerald-100 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-500/10'}`}>
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isBan ? 'bg-white text-rose-600 ring-1 ring-rose-100 dark:bg-slate-900 dark:text-rose-300 dark:ring-rose-400/20' : 'bg-white text-emerald-600 ring-1 ring-emerald-100 dark:bg-slate-900 dark:text-emerald-300 dark:ring-emerald-400/20'}`}>
              {isBan ? <Ban className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <h2 id="user-moderation-title" className="text-lg font-black text-slate-950 dark:text-slate-50">{title}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
            <p className="text-sm font-black text-slate-950 dark:text-slate-50">{state.user.fullName}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{state.user.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">{state.user.primaryRole}</p>
          </div>

          {isBan ? (
            <>
              <label className="block">
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">Reason category</span>
                <select
                  value={reasonCode}
                  onChange={event => onReasonCodeChange(event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="">Select a reason</option>
                  {banReasonOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">Ban reason</span>
                <textarea
                  value={reason}
                  onChange={event => onReasonChange(event.target.value)}
                  rows={3}
                  placeholder="Explain why this account is being banned."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">Internal note {reasonCode === 'OTHER' ? <span className="text-rose-600">*</span> : <span className="text-slate-400">(optional)</span>}</span>
                <textarea
                  value={internalNote}
                  onChange={event => onInternalNoteChange(event.target.value)}
                  rows={2}
                  placeholder="Add private moderation context."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </label>
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-semibold leading-6 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              Current ban reason: {state.user.banReason || state.user.banReasonCode || 'No reason recorded.'}
            </div>
          )}

          {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
          <button type="button" disabled={submitting} onClick={onClose} className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">Cancel</button>
          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className={`inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-sm transition disabled:cursor-wait disabled:opacity-70 ${isBan ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {isBan ? 'Ban user' : 'Restore access'}
          </button>
        </div>
      </MotionDiv>
    </div>
  );
};

const TableState = ({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) => (
  <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-[22px] border border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center dark:border-blue-400/20 dark:bg-blue-500/10">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-slate-900 dark:text-blue-300 dark:ring-blue-400/20">
      <Icon className="h-7 w-7" />
    </span>
    <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-slate-50">{title}</h3>
    <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    {action}
  </div>
);

const RoleBadge = ({ role }: { role: string }) => {
  const styles = role === 'ADMIN'
    ? 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20'
    : role === 'PROVIDER'
      ? 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20'
      : 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${styles}`}>{role}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20'
    : status === 'SUSPENDED' || status === 'BANNED'
      ? 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20'
      : 'bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${styles}`}>{status}</span>;
};

const VerifiedBadge = ({ verified }: { verified: boolean }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${verified ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20' : 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20'}`}>
    <BadgeCheck className="h-3.5 w-3.5" />
    {verified ? 'Verified' : 'Unverified'}
  </span>
);

const ActionIcon = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <button type="button" aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 opacity-80 transition duration-150 hover:-translate-y-px hover:bg-blue-50 hover:text-blue-700 hover:opacity-100 active:scale-[0.97] group-hover:text-slate-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 dark:group-hover:text-slate-300">
    <Icon className="h-4 w-4" />
  </button>
);

const ToolbarButton = ({ icon: Icon, label, badge }: { icon: React.ElementType; label: string; badge?: number }) => (
  <button
    type="button"
    disabled
    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 shadow-sm transition duration-150 hover:-translate-y-px active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-75 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-300"
  >
    <Icon className="h-4 w-4 text-blue-600" />
    {label}
    {!!badge && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] text-white">{badge}</span>}
  </button>
);

const PaginationButton = ({ icon: Icon, disabled, onClick }: { icon: React.ElementType; disabled?: boolean; onClick?: () => void }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition duration-150 hover:-translate-y-px hover:border-blue-200 hover:text-blue-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-400"
  >
    <Icon className="h-4 w-4" />
  </button>
);

const UserAnalyticsGrid = ({ statistics, users, loading }: { statistics?: AdminUserStatistics; users: AdminUser[]; loading: boolean }) => (
  <MotionSection
    className="mt-5 grid min-w-0 max-w-full gap-4 pb-24 pr-0 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] max-[380px]:grid-cols-1"
    variants={pageSequence}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.18 }}
  >
    <UserGrowthCard statistics={statistics} loading={loading} />
    <VerificationOverviewCard statistics={statistics} loading={loading} />
    <TopUserRolesCard statistics={statistics} loading={loading} />
    <RecentSignupsCard users={users} loading={loading} />
  </MotionSection>
);

const AnalyticsCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <MotionArticle variants={fadeUp} transition={quickTransition} className="min-h-[300px] w-full min-w-0 max-w-full rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
    <div className="flex min-w-0 items-center justify-between gap-3">
      <h3 className="min-w-0 text-lg font-semibold leading-tight tracking-tight text-slate-950 dark:text-slate-50">{title}</h3>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {children}
  </MotionArticle>
);

const UserGrowthCard = ({ statistics, loading }: { statistics?: AdminUserStatistics; loading: boolean }) => {
  const activeUsers = useAnimatedNumber(statistics?.activeUsers, loading);
  return (
    <AnalyticsCard
      title="User Growth"
      action={<button type="button" disabled className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-black text-slate-500 transition duration-150 disabled:opacity-70 dark:border-slate-700 dark:text-slate-400">Last 30 days</button>}
    >
      <div className="mt-4">
        <p className="text-[32px] font-black leading-tight text-slate-950 dark:text-slate-50">{loading ? '-' : activeUsers.toLocaleString()}</p>
        <p className="mt-1 text-[13px] font-black leading-5 text-emerald-600 dark:text-emerald-300">{loading ? 'Loading...' : `${formatNumber(statistics?.newUsersLast30Days)} new users in 30 days`}</p>
      </div>
      <EmptyChart icon={Users} title="Trend chart unavailable" description="The statistics endpoint provides totals, but not a user-growth time series yet." compact />
    </AnalyticsCard>
  );
};

const VerificationOverviewCard = ({ statistics, loading }: { statistics?: AdminUserStatistics; loading: boolean }) => {
  const verifiedUsers = useAnimatedNumber(statistics?.verifiedUsers, loading);
  return (
  <AnalyticsCard title="Verification Overview" action={<BadgeCheck className="h-5 w-5 text-violet-500" />}>
    <div className="mt-4 grid min-w-0 max-w-full items-center gap-5 2xl:grid-cols-[150px_minmax(0,1fr)]">
      <VerificationDonut total={statistics?.totalUsers ?? 0} verified={statistics?.verifiedUsers ?? 0} loading={loading} value={verifiedUsers} />
      <div className="min-w-0 max-w-full space-y-3">
        {[
          ['Verified', statistics?.verifiedUsers ?? 0],
          ['Unverified', Math.max((statistics?.totalUsers ?? 0) - (statistics?.verifiedUsers ?? 0), 0)],
          ['Pending', 0],
        ].map(([label, value], index) => (
          <MotionDiv key={label} variants={fadeUp} transition={{ ...quickTransition, delay: index * 0.04 }} className="flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-bold text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="truncate">{label}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap font-black text-slate-400">{loading ? '-' : Number(value).toLocaleString()}</span>
          </MotionDiv>
        ))}
        <button type="button" disabled className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-3 text-sm font-black text-blue-600 disabled:opacity-70 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">View verification logs</button>
      </div>
    </div>
  </AnalyticsCard>
  );
};

const VerificationDonut = ({ total, verified, loading, value }: { total: number; verified: number; loading: boolean; value: number }) => {
  const percent = total > 0 ? Math.min(Math.max(verified / total, 0), 1) : 0;
  return (
    <div className="relative mx-auto flex h-[150px] w-[150px] shrink-0 items-center justify-center text-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-slate-800" />
        <motion.circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          className="text-emerald-300"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: loading ? 0 : percent }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="relative z-10">
        <p className="text-2xl font-black text-slate-950 dark:text-slate-50">{loading ? '-' : value.toLocaleString()}</p>
        <p className="text-xs font-bold text-slate-500">Verified</p>
      </div>
    </div>
  );
};

const TopUserRolesCard = ({ statistics, loading }: { statistics?: AdminUserStatistics; loading: boolean }) => (
  <AnalyticsCard title="Top User Roles">
    <div className="mt-5 min-w-0 max-w-full space-y-5">
      {[
        ['Customers', statistics?.customers ?? 0],
        ['Providers', statistics?.providers ?? 0],
        ['Admins', statistics?.admins ?? 0],
      ].map(([role, value], index) => {
        const percent = statistics?.totalUsers ? Math.round((Number(value) / statistics.totalUsers) * 100) : 0;
        return (
        <div key={role} className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-black text-slate-700 dark:text-slate-200">{role}</span>
            <span className="shrink-0 whitespace-nowrap font-black text-slate-400">{loading ? '-' : `${Number(value).toLocaleString()} (${percent}%)`}</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              className={`h-full rounded-full ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-violet-500' : 'bg-amber-500'}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${percent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.48, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      )})}
      <button type="button" disabled className="mt-6 inline-flex h-10 items-center text-sm font-black text-blue-600 disabled:opacity-60 dark:text-blue-300">Manage roles</button>
    </div>
  </AnalyticsCard>
);

const RecentSignupsCard = ({ users, loading }: { users: AdminUser[]; loading: boolean }) => (
  <AnalyticsCard title="Recent Signups">
    {loading ? (
      <div className="mt-5 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
      </div>
    ) : users.length > 0 ? (
      <div className="mt-5 space-y-3">
        {users.slice(0, 4).map((user, index) => (
          <MotionDiv key={user.id} variants={fadeUp} transition={{ ...quickTransition, delay: index * 0.04 }} className="group grid min-w-0 grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800 sm:grid-cols-[44px_minmax(0,1fr)_auto]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700 transition-transform duration-200 group-hover:scale-[1.03] dark:bg-blue-500/15 dark:text-blue-300">{initials(user.fullName)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{user.fullName}</p>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{user.primaryRole}</p>
            </div>
            <span className="col-start-2 shrink-0 whitespace-nowrap text-xs font-bold text-slate-500 sm:col-start-auto">{formatRelative(user.createdAt)}</span>
          </MotionDiv>
        ))}
        <button type="button" disabled className="mt-3 inline-flex h-10 items-center text-sm font-black text-blue-600 disabled:opacity-60 dark:text-blue-300">View all users</button>
      </div>
    ) : (
      <div className="mt-5 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center dark:border-slate-700 dark:bg-slate-950/40">
        <UserPlus className="mx-auto h-8 w-8 text-blue-500" />
        <h4 className="mt-3 text-sm font-black text-slate-950 dark:text-slate-50">No recent users</h4>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">Recent signup rows appear here when users exist.</p>
      </div>
    )}
  </AnalyticsCard>
);

const EmptyChart = ({ icon: Icon, title, description, compact = false }: { icon: React.ElementType; title: string; description: string; compact?: boolean }) => (
  <div className={`mt-4 flex w-full flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center dark:border-slate-700 dark:bg-slate-950/40 ${compact ? 'min-h-[210px]' : 'min-h-[220px]'}`}>
    <Icon className="h-9 w-9 text-blue-500" />
    <h4 className="mt-3 text-sm font-black text-slate-950 dark:text-slate-50">{title}</h4>
    <p className="mx-auto mt-2 max-w-[260px] text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);
