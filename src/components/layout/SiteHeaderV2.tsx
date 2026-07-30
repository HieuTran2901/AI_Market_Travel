import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Coins,
  CreditCard,
  Gift,
  Globe2,
  Heart,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  User,
  Zap,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useAiCoinWallet } from "@/hooks/useAiCoinWallet";
import { useCoinAnimation } from "@/hooks/useCoinAnimation";
import { bookingService } from "@/services/bookingService";
import { cn } from "@/lib/utils";

const COIN_IMAGE_SRC = "/assets/coin.png";

type NavAction = {
  label: string;
  to: string;
  icon: React.ElementType;
};

type OpenHeaderMenu = "coins" | "profile" | null;

const navActions: NavAction[] = [
  { label: "Explore", to: "/search", icon: Search },
  { label: "AI Planner", to: "/ai/planner", icon: Sparkles },
  { label: "My Trips", to: "/trips/my", icon: CalendarCheck },
  { label: "Become a Provider", to: "/register", icon: BriefcaseBusiness },
];

const accountActions: NavAction[] = [
  { label: "My Bookings", to: "/profile", icon: CalendarCheck },
  { label: "Wishlist", to: "/wishlist", icon: Heart },
  { label: "Payments", to: "/payments/history", icon: CreditCard },
  { label: "Settings", to: "/profile", icon: Settings },
];

const coinMenuRows: NavAction[] = [
  { label: "Mua them AI Coins", to: "/payments/history", icon: Plus },
  { label: "Lich su giao dich", to: "/payments/history", icon: CreditCard },
  { label: "Uu dai & su kien", to: "/deals", icon: Gift },
];

const HeaderBrand = ({ onNavigate }: { onNavigate: (path: string) => void }) => (
  <button
    type="button"
    onClick={() => onNavigate("/")}
    className="group flex min-w-0 shrink-0 items-center gap-3 rounded-2xl pr-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
    aria-label="Go to AI Marketplace Traveler homepage"
  >
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/15 shadow-[0_0_24px_rgba(59,130,246,0.28)]">
      <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/25 via-blue-500/15 to-violet-500/25 blur-sm transition group-hover:opacity-90" />
      <img
        src="/brand/ai-marketplace-traveler-logo.png"
        alt=""
        className="relative h-10 w-10 object-contain brightness-0 invert"
      />
    </span>
    <span className="hidden min-w-0 leading-none sm:block">
      <span className="block truncate text-[18px] font-black tracking-tight text-white">AI Marketplace</span>
      <span className="mt-1 block text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Traveler</span>
    </span>
    <span className="ml-1 hidden h-9 w-px bg-white/10 xl:block" />
  </button>
);

const HeaderSearch = ({
  onNavigate,
  inputRef,
  className,
}: {
  onNavigate: (path: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  className?: string;
}) => (
  <form
    className={cn("hidden min-w-0 flex-1 lg:block", className)}
    onSubmit={(event) => {
      event.preventDefault();
      const value = inputRef.current?.value?.trim();
      onNavigate(value ? `/search?keyword=${encodeURIComponent(value)}` : "/search");
    }}
  >
    <label className="sr-only" htmlFor="site-search-v2">Search marketplace</label>
    <div className="group flex h-14 min-w-0 items-center gap-3 rounded-full border border-slate-400/15 bg-[#081637]/85 px-5 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition focus-within:border-blue-300/50 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.14),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <Search className="h-[22px] w-[22px] shrink-0 text-slate-300 group-focus-within:text-cyan-200" />
      <input
        ref={inputRef}
        id="site-search-v2"
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none"
        placeholder="Search hotels, tours, restaurants..."
        autoComplete="off"
      />
      <span className="hidden rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-black text-slate-300 xl:inline">Ctrl K</span>
    </div>
  </form>
);

const AiCoinsCard = ({
  isOpen,
  setOpenMenu,
  menuRef,
  onNavigate,
  balanceLabel,
}: {
  isOpen: boolean;
  setOpenMenu: React.Dispatch<React.SetStateAction<OpenHeaderMenu>>;
  menuRef: React.RefObject<HTMLDivElement>;
  onNavigate: (path: string) => void;
  balanceLabel: string;
}) => {
  return (
    <div ref={menuRef} className="relative hidden shrink-0 md:block">
      <button
        type="button"
        onClick={() => setOpenMenu((open) => (open === "coins" ? null : "coins"))}
        className="group relative flex h-[60px] items-center gap-3 overflow-hidden rounded-[24px] border border-amber-300/50 bg-[linear-gradient(135deg,rgba(92,58,10,0.48),rgba(31,25,36,0.78))] px-4 pr-3 text-left shadow-[0_0_28px_rgba(245,158,11,0.18)] transition hover:-translate-y-0.5 hover:border-amber-200/70 hover:shadow-[0_0_34px_rgba(245,158,11,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
        aria-label="Open AI Coins menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="site-header-v2-coins-menu"
      >
        <span aria-hidden="true" className="absolute -right-4 -top-5 h-16 w-16 rounded-full bg-amber-300/10 blur-2xl" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/40 bg-amber-400/20 shadow-[0_0_22px_rgba(245,158,11,0.35)]">
          <img src={COIN_IMAGE_SRC} alt="" className="h-9 w-9 object-contain" />
        </span>
        <span className="relative hidden leading-tight lg:block">
          <span className="block text-lg font-black tabular-nums text-white">{balanceLabel}</span>
          <span className="block text-[11px] font-bold text-amber-100/90">AI Coins</span>
        </span>
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/30 bg-slate-950/35 text-amber-100 transition group-hover:border-amber-100/50 group-hover:bg-slate-950/55">
          <Plus className="h-[18px] w-[18px]" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="site-header-v2-coins-menu"
            role="menu"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-[calc(100%+12px)] z-[2200] w-[min(330px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white text-slate-900 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-900/5"
          >
            <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-br from-white to-amber-50/80 p-5">
              <img src={COIN_IMAGE_SRC} alt="" className="h-20 w-20 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="text-3xl font-black tabular-nums tracking-tight text-slate-950">{balanceLabel}</p>
                <p className="mt-1 text-base font-bold text-slate-500">AI Coins</p>
              </div>
            </div>
            <div className="p-2">
              {coinMenuRows.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate(item.to)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
                  role="menuitem"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
            <div className="p-3 pt-1">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-3 text-blue-700">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Zap className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black">Nap coin - Mo khoa trai nghiem</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">Thanh toan nhanh, nhan uu dai hon!</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuickIconButton = ({
  label,
  icon: Icon,
  onClick,
  badge,
  badgeTone = "violet",
}: {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  badge?: number;
  badgeTone?: "violet" | "red";
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-slate-100 transition hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
    aria-label={label}
  >
    <Icon className="h-[22px] w-[22px]" />
    {badge ? (
      <span
        className={cn(
          "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white ring-2 ring-[#071634]",
          badgeTone === "red" ? "bg-red-500" : "bg-violet-500",
        )}
      >
        {Math.min(badge, 99)}
      </span>
    ) : null}
  </button>
);

const HeaderQuickActions = ({
  cartCount,
  onNavigate,
}: {
  cartCount: number;
  onNavigate: (path: string) => void;
}) => (
  <div className="hidden shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] p-1.5 lg:flex">
    <QuickIconButton label="Language and currency" icon={Globe2} />
    <QuickIconButton label="Saved listings" icon={Heart} onClick={() => onNavigate("/wishlist")} />
    <QuickIconButton label="Cart" icon={ShoppingCart} badge={cartCount} onClick={() => onNavigate("/cart")} />
    <QuickIconButton label="Notifications" icon={Bell} />
  </div>
);

const ProviderCta = ({ onNavigate }: { onNavigate: (path: string) => void }) => (
  <button
    type="button"
    onClick={() => onNavigate("/register")}
    className="hidden h-[60px] shrink-0 items-center gap-2 rounded-[24px] bg-blue-600 px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.34)] transition hover:-translate-y-0.5 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 lg:inline-flex max-[1320px]:px-4"
  >
    <BriefcaseBusiness className="h-[20px] w-[20px]" />
    <span className="whitespace-nowrap max-[1320px]:hidden">Become a Provider</span>
    <span className="hidden whitespace-nowrap max-[1320px]:inline">Provider</span>
  </button>
);

const HeaderAccountMenu = ({
  isOpen,
  setOpenMenu,
  menuRef,
  displayName,
  initials,
  user,
  isAuthenticated,
  onNavigate,
  onLogout,
}: {
  isOpen: boolean;
  setOpenMenu: React.Dispatch<React.SetStateAction<OpenHeaderMenu>>;
  menuRef: React.RefObject<HTMLDivElement>;
  displayName: string;
  initials: string;
  user: ReturnType<typeof useAuth>["user"];
  isAuthenticated: boolean;
  onNavigate: (path: string) => void;
  onLogout: () => Promise<void>;
}) => {
  const roles = user?.roles ?? [];
  const roleLabel = roles.some((role) => role.includes("ADMIN"))
    ? "Admin"
    : roles.some((role) => role.includes("PROVIDER"))
      ? "Provider"
      : "Traveler";

  if (!isAuthenticated || !user) {
    return (
      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <Button variant="outline" className="h-11 rounded-full border-white/15 bg-white/[0.04] px-4 font-semibold text-white hover:bg-white/10 hover:text-white" onClick={() => onNavigate("/login")}>
          Log In
        </Button>
        <Button className="h-11 rounded-full bg-blue-600 px-4 font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] hover:bg-blue-500" onClick={() => onNavigate("/register")}>
          Sign Up
        </Button>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative hidden shrink-0 md:block">
      <button
        type="button"
        onClick={() => setOpenMenu((open) => (open === "profile" ? null : "profile"))}
        className="flex h-[60px] w-[min(240px,20vw)] min-w-[190px] items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.045] py-1.5 pl-1.5 pr-3 text-left text-white transition hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 max-xl:w-auto max-xl:min-w-0"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-black text-white max-xl:h-11 max-xl:w-11">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#081637] bg-violet-500" />
        </span>
        <span className="min-w-0 flex-1 leading-tight max-xl:hidden">
          <span className="block truncate text-sm font-black">{displayName}</span>
          <span className="mt-0.5 block truncate text-[11px] font-bold text-violet-200">{roleLabel}</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-300" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="menu"
            className="absolute right-0 top-[calc(100%+12px)] z-[2100] w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15"
          >
            <div className="border-b border-slate-100 bg-slate-50 p-4">
              <p className="truncate text-sm font-black text-slate-950">{displayName}</p>
              <p className="truncate text-xs font-semibold text-slate-500">{user.email}</p>
            </div>
            <div className="p-2">
              {accountActions.map((item) => (
                <button key={item.label} type="button" onClick={() => onNavigate(item.to)} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              {roles.some((role) => role.includes("PROVIDER")) && (
                <button type="button" onClick={() => onNavigate("/provider/dashboard")} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Provider Dashboard
                </button>
              )}
            </div>
            <div className="border-t border-slate-100 p-2">
              <button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HeaderMobileMenu = ({
  open,
  setOpen,
  cartCount,
  initials,
  isAuthenticated,
  displayName,
  balanceLabel,
  onNavigate,
  onLogout,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cartCount: number;
  initials: string;
  isAuthenticated: boolean;
  displayName: string;
  balanceLabel: string;
  onNavigate: (path: string) => void;
  onLogout: () => Promise<void>;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-[2200] bg-slate-950/55 backdrop-blur-sm md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} className="h-full w-[min(86vw,360px)] overflow-y-auto bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <img src="/brand/ai-marketplace-traveler-logo.png" alt="AI Marketplace Traveler" className="h-10 w-auto" />
            <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            <button type="button" onClick={() => onNavigate("/search")} className="mb-4 flex h-12 w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600">
              <Search className="h-5 w-5" />
              Search marketplace
            </button>
            <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="flex items-center gap-3">
                <Coins className="h-6 w-6" />
                <div>
                  <p className="text-lg font-black">{balanceLabel}</p>
                  <p className="text-xs font-bold">AI Coins - Top-up coming soon</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {[...navActions, { label: "Cart", to: "/cart", icon: ShoppingCart }, { label: "Wishlist", to: "/wishlist", icon: Heart }].map((item) => (
                <button key={item.label} type="button" onClick={() => onNavigate(item.to)} className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-slate-800 hover:bg-blue-50 hover:text-blue-700">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  {item.label === "Cart" && cartCount > 0 ? <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">{cartCount}</span> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-100 p-4">
            {isAuthenticated ? (
              <>
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{initials}</span>
                  <span className="min-w-0 truncate text-sm font-black text-slate-950">{displayName}</span>
                </div>
                <button type="button" onClick={onLogout} className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-black text-red-600">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => onNavigate("/login")}>Log In</Button>
                <Button onClick={() => onNavigate("/register")}>Sign Up</Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const SiteHeaderV2: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const aiCoinWalletQuery = useAiCoinWallet();
  const [cartCount, setCartCount] = React.useState(0);
  const [openHeaderMenu, setOpenHeaderMenu] = React.useState<OpenHeaderMenu>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isSecondaryNavOpen, setIsSecondaryNavOpen] = React.useState(() =>
    typeof window === "undefined"
      ? true
      : window.sessionStorage.getItem("ai-travel-secondary-nav-collapsed") !== "true",
  );
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const coinMenuRef = React.useRef<HTMLDivElement>(null);
  const accountMenuRef = React.useRef<HTMLDivElement>(null);

  const displayName = user?.fullName || user?.email || "Traveler";
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AI";
  const aiCoinBalance = aiCoinWalletQuery.data?.balance ?? 0;
  const animatedBalance = useCoinAnimation(aiCoinBalance, 800);
  const aiCoinBalanceLabel = aiCoinWalletQuery.isLoading ? "..." : animatedBalance.toLocaleString("en-US");

  const goTo = React.useCallback((path: string) => {
    setOpenHeaderMenu(null);
    setMobileOpen(false);
    navigate(path);
  }, [navigate]);

  const refreshCartCount = React.useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const response = await bookingService.getCart();
      setCartCount(response.data?.items?.length ?? 0);
    } catch {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  React.useEffect(() => {
    window.sessionStorage.setItem("ai-travel-secondary-nav-collapsed", String(!isSecondaryNavOpen));
  }, [isSecondaryNavOpen]);

  React.useEffect(() => {
    const onCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ count?: number }>).detail;
      if (typeof detail?.count === "number") {
        setCartCount(detail.count);
        return;
      }
      refreshCartCount();
    };
    window.addEventListener("ai-travel-cart-updated", onCartUpdated);
    return () => window.removeEventListener("ai-travel-cart-updated", onCartUpdated);
  }, [refreshCartCount]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenHeaderMenu(null);
        setMobileOpen(false);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (coinMenuRef.current?.contains(target) || accountMenuRef.current?.contains(target)) {
        return;
      }
      setOpenHeaderMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const handleLogout = React.useCallback(async () => {
    await logout();
    goTo("/login");
  }, [logout, goTo]);

  return (
    <>
      <header className="sticky top-0 z-[1000] w-full overflow-visible bg-[radial-gradient(circle_at_50%_-30%,rgba(79,70,229,0.18),transparent_46%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(248,250,252,0.74))] px-[clamp(12px,2vw,28px)] pb-2 pt-2">
        <div className="mx-auto w-full max-w-none overflow-visible">
          <div className="relative overflow-visible rounded-[30px] border border-blue-300/10 px-3 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.34),0_0_42px_rgba(59,130,246,0.10)] sm:px-4">
            <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,rgba(3,12,36,0.98),rgba(5,18,55,0.98))]">
              <span className="pointer-events-none absolute -left-16 -top-20 h-44 w-44 rounded-full bg-blue-500/15 blur-3xl" />
              <span className="pointer-events-none absolute left-1/2 top-0 h-28 w-80 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
            </div>
            <div className="relative hidden grid-cols-[auto_minmax(300px,1fr)_auto_auto_auto_minmax(180px,auto)] items-center gap-3 xl:grid">
              <HeaderBrand onNavigate={goTo} />
              <HeaderSearch onNavigate={goTo} inputRef={searchInputRef} />
              <AiCoinsCard isOpen={openHeaderMenu === "coins"} setOpenMenu={setOpenHeaderMenu} menuRef={coinMenuRef} onNavigate={goTo} balanceLabel={aiCoinBalanceLabel} />
              <ProviderCta onNavigate={goTo} />
              <HeaderQuickActions cartCount={cartCount} onNavigate={goTo} />
              <HeaderAccountMenu isOpen={openHeaderMenu === "profile"} setOpenMenu={setOpenHeaderMenu} menuRef={accountMenuRef} displayName={displayName} initials={initials} user={user} isAuthenticated={isAuthenticated} onNavigate={goTo} onLogout={handleLogout} />
            </div>
            <div className="relative hidden items-center gap-3 md:flex xl:hidden">
              <HeaderBrand onNavigate={goTo} />
              <HeaderSearch onNavigate={goTo} inputRef={searchInputRef} />
              <AiCoinsCard isOpen={openHeaderMenu === "coins"} setOpenMenu={setOpenHeaderMenu} menuRef={coinMenuRef} onNavigate={goTo} balanceLabel={aiCoinBalanceLabel} />
              <ProviderCta onNavigate={goTo} />
              <QuickIconButton label="Cart" icon={ShoppingCart} badge={cartCount} onClick={() => goTo("/cart")} />
              <QuickIconButton label="Notifications" icon={Bell} />
              <HeaderAccountMenu isOpen={openHeaderMenu === "profile"} setOpenMenu={setOpenHeaderMenu} menuRef={accountMenuRef} displayName={displayName} initials={initials} user={user} isAuthenticated={isAuthenticated} onNavigate={goTo} onLogout={handleLogout} />
            </div>
            <div className="relative md:hidden">
              <div className="grid h-14 grid-cols-[48px_minmax(0,1fr)_auto_auto_auto_auto] items-center gap-2">
                <button type="button" onClick={() => setMobileOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white" aria-label="Open navigation">
                  <Menu className="h-[22px] w-[22px]" />
                </button>
                <HeaderBrand onNavigate={goTo} />
                <div ref={coinMenuRef} className="relative">
                  <QuickIconButton label="AI Coins" icon={Coins} onClick={() => setOpenHeaderMenu((open) => (open === "coins" ? null : "coins"))} />
                  <AnimatePresence>
                    {openHeaderMenu === "coins" && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-[calc(100%+12px)] z-[2200] w-[min(318px,calc(100vw-24px))] overflow-hidden rounded-[22px] border border-slate-200/80 bg-white text-slate-900 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-900/5"
                      >
                        <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-br from-white to-amber-50/80 p-4">
                          <img src={COIN_IMAGE_SRC} alt="" className="h-16 w-16 shrink-0 object-contain" />
                          <div>
                            <p className="text-2xl font-black tabular-nums tracking-tight text-slate-950">{aiCoinBalanceLabel}</p>
                            <p className="text-sm font-bold text-slate-500">AI Coins</p>
                          </div>
                        </div>
                        <div className="p-2">
                          {coinMenuRows.map((item) => (
                            <button key={item.label} type="button" onClick={() => goTo(item.to)} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700" role="menuitem">
                              <item.icon className="h-4 w-4" />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <QuickIconButton label="Cart" icon={ShoppingCart} badge={cartCount} onClick={() => goTo("/cart")} />
                <QuickIconButton label="Notifications" icon={Bell} />
                <button type="button" onClick={() => (isAuthenticated ? setOpenHeaderMenu((open) => (open === "profile" ? null : "profile")) : goTo("/login"))} className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white" aria-label="Open account">
                  {isAuthenticated ? initials : <User className="h-[22px] w-[22px]" />}
                </button>
              </div>
              <div className="mt-3">
                <HeaderSearch onNavigate={goTo} inputRef={searchInputRef} className="block lg:hidden" />
              </div>
            </div>
          </div>
          <motion.div
            initial={false}
            animate={isSecondaryNavOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="hidden overflow-hidden lg:block"
            aria-hidden={!isSecondaryNavOpen}
          >
            <div className="mt-2 flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
              <nav className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto" aria-label="Marketplace navigation">
                {navActions.map((item) => (
                  <NavLink key={item.label} to={item.to} className={({ isActive }) => cn("inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-black text-slate-600 transition hover:bg-blue-50 hover:text-blue-700", isActive && "bg-blue-600 text-white shadow-sm hover:bg-blue-600 hover:text-white")}>
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <button
                type="button"
                onClick={() => setIsSecondaryNavOpen(false)}
                className="hidden h-10 shrink-0 items-center gap-2 rounded-full px-2 pl-4 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-blue-700 xl:inline-flex"
                aria-label="Collapse travel navigation"
                aria-expanded={isSecondaryNavOpen}
              >
                Collapse
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
                  <ChevronUp className="h-4 w-4" />
                </span>
              </button>
            </div>
          </motion.div>
          <AnimatePresence initial={false}>
            {!isSecondaryNavOpen && (
              <motion.div
                key="site-header-v2-secondary-toggle"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="hidden justify-center lg:flex"
              >
                <button
                  type="button"
                  onClick={() => setIsSecondaryNavOpen(true)}
                  className="group flex h-7 w-14 items-center justify-center rounded-b-2xl border border-t-0 border-white/15 bg-slate-950/80 text-white/80 shadow-md backdrop-blur-md transition hover:h-8 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                  aria-label="Expand travel navigation"
                  aria-expanded={isSecondaryNavOpen}
                >
                  <ChevronDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
      <HeaderMobileMenu open={mobileOpen} setOpen={setMobileOpen} cartCount={cartCount} initials={initials} isAuthenticated={isAuthenticated} displayName={displayName} balanceLabel={aiCoinBalanceLabel} onNavigate={goTo} onLogout={handleLogout} />
    </>
  );
};

export default SiteHeaderV2;
