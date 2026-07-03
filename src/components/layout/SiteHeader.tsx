import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Car,
  ChevronDown,
  CreditCard,
  Gift,
  Globe2,
  Heart,
  HelpCircle,
  Headphones,
  Hotel,
  Lock,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/bookingService";
import { cn } from "@/lib/utils";

type HeaderLink = {
  label: string;
  to: string;
  icon?: React.ElementType;
  badge?: "Hot" | "New";
};

const primaryNav: HeaderLink[] = [
  { label: "Explore", to: "/search", icon: Search },
  { label: "Stays", to: "/search?category=HOTEL", icon: Hotel },
  { label: "Tours", to: "/search?category=TOUR", icon: Ticket },
  { label: "Experiences", to: "/search?category=EXPERIENCE", icon: Star },
  { label: "Restaurants", to: "/search?category=RESTAURANT", icon: Utensils },
  { label: "Vehicles", to: "/search?category=VEHICLE", icon: Car },
  { label: "Deals", to: "/search?sort=deals", icon: Gift, badge: "Hot" },
  { label: "AI Planner", to: "/ai/planner", icon: Sparkles, badge: "New" },
];

const tabletNav: HeaderLink[] = [
  primaryNav[0],
  primaryNav[1],
  primaryNav[2],
  primaryNav[3],
  primaryNav[7],
];

const moreNav: HeaderLink[] = [
  primaryNav[4],
  primaryNav[5],
  primaryNav[6],
  { label: "Become a Provider", to: "/register", icon: BriefcaseBusiness },
];

export const SiteHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!userOpen && !mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserOpen(false);
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [userOpen, mobileOpen]);

  React.useEffect(() => {
    if (!mobileOpen && !userOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, userOpen]);

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
    const onCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ count?: number }>).detail;
      if (typeof detail?.count === "number") {
        setCartCount(detail.count);
        return;
      }

      refreshCartCount();
    };

    window.addEventListener("ai-travel-cart-updated", onCartUpdated);

    return () =>
      window.removeEventListener("ai-travel-cart-updated", onCartUpdated);
  }, [refreshCartCount]);

  const displayName = user?.fullName || user?.email || "Traveler";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AI";

  const isProvider = user?.roles?.some((role) =>
    role.startsWith("ROLE_PROVIDER_"),
  );

  const accountLinks: Array<HeaderLink & { description?: string }> = [
    {
      label: "My Bookings",
      to: "/profile",
      icon: CalendarCheck,
      description: "View and manage your bookings",
    },
    {
      label: "Payments",
      to: "/payments/history",
      icon: CreditCard,
      description: "Payment methods and history",
    },
    {
      label: "Reviews",
      to: "/profile",
      icon: Star,
      description: "Your reviews and ratings",
    },
    {
      label: "Wishlist",
      to: "/wishlist",
      icon: Heart,
      description: "Saved properties and experiences",
    },
    ...(isProvider
      ? [
          {
            label: "Provider Dashboard",
            to: "/provider/dashboard",
            icon: BriefcaseBusiness,
            description: "Manage your listings and bookings",
          },
        ]
      : []),
    {
      label: "Settings",
      to: "/profile",
      icon: Settings,
      description: "Account, profile and preferences",
    },
    {
      label: "Help Center",
      to: "/search",
      icon: HelpCircle,
      description: "FAQs and support",
    },
  ];

  const travelLinks = accountLinks.filter((item) =>
    ["My Bookings", "Payments", "Reviews", "Wishlist"].includes(item.label),
  );

  const providerLinks = [
    ...(isProvider
      ? [
          {
            label: "Provider Dashboard",
            to: "/provider/dashboard",
            icon: BriefcaseBusiness,
            description: "Manage your business overview",
          },
          {
            label: "Manage Listings",
            to: "/provider/listings",
            icon: Hotel,
            description: "Edit inventory and availability",
          },
          {
            label: "Settlements",
            to: "/provider/settlements",
            icon: CreditCard,
            description: "Track payouts and balances",
          },
        ]
      : []),
  ];

  const accountUtilityLinks = accountLinks.filter((item) =>
    ["Settings", "Help Center"].includes(item.label),
  );

  const goTo = (path: string) => {
    setMobileOpen(false);
    setMoreOpen(false);
    setUserOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    setUserOpen(false);
    navigate("/login");
  };

  const NavItem = ({
    item,
    compact = false,
  }: {
    item: HeaderLink;
    compact?: boolean;
  }) => (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "group relative inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
          compact ? "flex-col gap-1 px-2 text-xs" : "rounded-full px-4",
          isActive && "text-blue-700",
        )
      }
    >
      {({ isActive }) => (
        <>
          {item.icon && (
            <item.icon
              className={cn(
                "h-4 w-4",
                isActive
                  ? "text-blue-600"
                  : "text-slate-700 group-hover:text-blue-600",
              )}
            />
          )}

          <span>{item.label}</span>

          {item.badge && (
            <span
              className={cn(
                "absolute -top-2 right-1 rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none",
                item.badge === "Hot"
                  ? "bg-red-500 text-white"
                  : "bg-violet-100 text-violet-700",
              )}
            >
              {item.badge}
            </span>
          )}

          <span
            className={cn(
              "absolute bottom-0 h-0.5 rounded-full bg-blue-600 transition-all duration-200",
              isActive ? "w-10" : "w-0 group-hover:w-8",
            )}
          />
        </>
      )}
    </NavLink>
  );

  const IconButton = ({
    label,
    icon: Icon,
    onClick,
    badge,
  }: {
    label: string;
    icon: React.ElementType;
    onClick?: () => void;
    badge?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={label}
    >
      <Icon className="h-5 w-5" />

      {badge && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );

  const AccountHeader = ({ compact = false }: { compact?: boolean }) => (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-slate-100",
        compact ? "p-4" : "p-4",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-black text-white shadow-sm shadow-blue-500/20",
          compact ? "h-11 w-11 text-sm" : "h-12 w-12 text-sm",
        )}
      >
        {initials}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-slate-950">
          {displayName}
        </span>
        <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
          {user?.email}
        </span>
      </span>

      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
        {isProvider ? "Provider" : "Member"}
      </span>
    </div>
  );

  const AccountMenuItem = ({
    item,
    compact = false,
    accent = "blue",
  }: {
    item: HeaderLink & { description?: string };
    compact?: boolean;
    accent?: "blue" | "emerald" | "slate";
  }) => (
    <button
      type="button"
      onClick={() => goTo(item.to)}
      className={cn(
        "group rounded-2xl text-left transition-all duration-200 hover:translate-x-0.5 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
        compact
          ? "flex min-h-[78px] flex-col items-center justify-center gap-2 px-2 py-3 text-center text-xs font-black text-slate-800"
          : "flex min-h-[52px] w-full items-center gap-3 px-3 py-1.5 text-sm font-black text-slate-800",
      )}
    >
      {item.icon && (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl group-hover:text-blue-600",
            compact ? "h-8 w-8 bg-slate-50 text-slate-700" : "h-9 w-9",
            accent === "blue" && !compact && "bg-blue-50 text-blue-700",
            accent === "emerald" &&
              !compact &&
              "bg-emerald-50 text-emerald-700",
            accent === "slate" && !compact && "bg-slate-100 text-slate-700",
          )}
        >
          <item.icon className="h-4 w-4" />
        </span>
      )}

      <span className={compact ? "leading-4" : "min-w-0 flex-1"}>
        <span className="block">{item.label}</span>

        {!compact && item.description && (
          <span className="mt-0.5 block truncate text-xs font-medium text-slate-500 group-hover:text-blue-600/80">
            {item.description}
          </span>
        )}
      </span>

      {!compact && (
        <ChevronDown className="-rotate-90 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
      )}
    </button>
  );

  const AccountSection = ({
    title,
    items,
    accent,
  }: {
    title: string;
    items: Array<HeaderLink & { description?: string }>;
    accent: "blue" | "emerald" | "slate";
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="py-2">
        <p className="px-3 pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          {title}
        </p>

        <div className="space-y-0.5">
          {items.map((item) => (
            <AccountMenuItem key={item.label} item={item} accent={accent} />
          ))}
        </div>
      </div>
    );
  };

  const AccountDropdown = () => (
    <>
      <button
        className="fixed inset-0 z-30 cursor-default"
        onClick={() => setUserOpen(false)}
        aria-label="Close user menu"
      />

      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-0 top-full z-[100] mt-3 w-[min(420px,calc(100vw-32px))] origin-top-right overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/14 ring-1 ring-slate-900/5 lg:w-[372px]"
      >
        <div className="bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/25">
              {initials}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-slate-950">
                {displayName}
              </span>
              <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                {user?.email}
              </span>
            </span>

            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-blue-700 shadow-sm ring-1 ring-blue-100">
              {isProvider ? "Provider" : "Member"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => goTo("/profile")}
            className="mt-3 flex h-9 w-full items-center justify-between rounded-2xl border border-blue-100 bg-white px-3 text-xs font-black text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View profile
            <ChevronDown className="-rotate-90 h-4 w-4" />
          </button>
        </div>

        <div className="hidden grid-cols-4 gap-2 border-b border-slate-100 p-4 md:grid lg:hidden">
          {accountLinks.map((item) => (
            <AccountMenuItem key={item.label} item={item} compact />
          ))}
        </div>

        <div className="p-2 md:hidden lg:block">
          <AccountSection title="Travel" items={travelLinks} accent="blue" />
          <AccountSection
            title="Provider"
            items={providerLinks}
            accent="emerald"
          />
          <AccountSection
            title="Account"
            items={accountUtilityLinks}
            accent="slate"
          />
        </div>

        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <LogOut className="h-4 w-4" />
            </span>
            Log out
          </button>
        </div>
      </motion.div>
    </>
  );

  const MobileAccountSheet = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] overflow-x-hidden bg-slate-950/35 backdrop-blur-sm md:hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-3 top-[72px] flex max-h-[calc(100dvh-88px)] w-[calc(100vw-24px)] max-w-none origin-top flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-black text-slate-950">Account</p>

          <button
            type="button"
            onClick={() => setUserOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close account menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AccountHeader compact />

        <div className="flex-1 overflow-y-auto p-3">
          {accountLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => goTo(item.to)}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-slate-800 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              <span className="flex-1">{item.label}</span>
              <ChevronDown className="-rotate-90 h-4 w-4 text-slate-400" />
            </button>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-2xl border-t border-slate-100 px-3 pt-3 text-left text-sm font-black text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50 p-4 text-center text-[11px] font-bold text-slate-700">
          <span className="flex flex-col items-center gap-1">
            <Headphones className="h-4 w-4" />
            24/7 Support
          </span>

          <span className="flex flex-col items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            Best Price
          </span>

          <span className="flex flex-col items-center gap-1">
            <Lock className="h-4 w-4" />
            Secure Booking
          </span>
        </div>
      </motion.div>
    </motion.div>
  );

  const MobileNavigationSheet = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] overflow-x-hidden bg-slate-950/35 backdrop-blur-sm md:hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-3 top-[72px] flex max-h-[calc(100dvh-88px)] w-[calc(100vw-24px)] max-w-none flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-800"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
            {isAuthenticated ? initials : "AI"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-950">
              {isAuthenticated ? displayName : "Welcome traveler"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {isAuthenticated ? user?.email : "Sign in for bookings and deals"}
            </p>
          </div>

          {!isAuthenticated && (
            <Button
              className="rounded-2xl bg-blue-600"
              onClick={() => goTo("/login")}
            >
              Login
            </Button>
          )}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 min-[420px]:grid-cols-2 min-[420px]:gap-4">
          <div className="space-y-1">
            {primaryNav.slice(0, 7).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => goTo(item.to)}
                className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-3 min-[420px]:border-l min-[420px]:border-t-0 min-[420px]:pl-4 min-[420px]:pt-0">
            {[primaryNav[7], ...accountLinks].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => goTo(item.to)}
                className="relative flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}

                {item.badge && (
                  <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] text-violet-700">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-800 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50 p-4 text-center text-[11px] font-bold text-slate-700">
          <span className="flex flex-col items-center gap-1">
            <Headphones className="h-4 w-4" />
            24/7 Support
          </span>

          <span className="flex flex-col items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            Best Price
          </span>

          <span className="flex flex-col items-center gap-1">
            <Lock className="h-4 w-4" />
            Secure Booking
          </span>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-slate-200/80 bg-white/92 shadow-xl shadow-slate-900/5 backdrop-blur-xl"
            : "border-white/60 bg-white/80 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl",
        )}
      >
        <div className="mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-8">
          <div className="hidden min-h-[76px] items-center gap-4 md:flex xl:min-h-[72px]">
            <button
              type="button"
              onClick={() => goTo("/")}
              className="group flex shrink-0 rounded-full pr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Go to AI Marketplace Traveler homepage"
            >
              <img
                src="/brand/ai-marketplace-traveler-logo.png"
                alt="AI Marketplace Traveler"
                className="h-11 w-auto max-w-[180px] object-contain transition-transform group-hover:scale-[1.02] xl:h-12 xl:max-w-[200px]"
              />
            </button>

            <button
              type="button"
              onClick={() => goTo("/search")}
              className="flex h-11 min-w-0 max-w-[480px] flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-5 text-left text-sm font-semibold text-slate-500 shadow-lg shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-500 xl:max-w-[540px]"
            >
              <Search className="h-5 w-5 shrink-0 text-slate-500" />
              <span className="truncate">
                Search destinations, hotels, tours...
              </span>
              <span className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-slate-400">
                ⌘ K
              </span>
            </button>

            <nav
              className="hidden flex-1 justify-center lg:flex xl:hidden"
              aria-label="Tablet navigation"
            >
              <div className="grid grid-cols-6 gap-1">
                {tabletNav.map((item) => (
                  <NavItem key={item.label} item={item} compact />
                ))}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMoreOpen((open) => !open)}
                    className="relative inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-bold text-slate-700 transition-all hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ChevronDown className="h-4 w-4" />
                    More
                  </button>

                  {moreOpen && (
                    <div className="absolute right-0 z-40 mt-3 w-64 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                      {moreNav.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => goTo(item.to)}
                          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {item.icon && (
                            <item.icon className="h-4 w-4 text-blue-600" />
                          )}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                className="hidden h-10 rounded-full border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 hover:bg-blue-100 xl:inline-flex"
                onClick={() => goTo("/register")}
              >
                Become a Provider
              </Button>

              <IconButton label="Language and currency" icon={Globe2} />
              <IconButton
                label="Wishlist"
                icon={Heart}
                onClick={() => goTo("/wishlist")}
              />
              <IconButton
                label="Cart"
                icon={ShoppingCart}
                onClick={() => goTo("/cart")}
                badge={cartCount > 0 ? String(Math.min(cartCount, 99)) : undefined}
              />
              <IconButton label="Notifications" icon={Bell} badge="3" />

              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserOpen((open) => !open)}
                    className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-black text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-expanded={userOpen}
                    aria-haspopup="menu"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                      {initials}
                    </span>
                    <span className="hidden max-w-28 truncate xl:inline">
                      {displayName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {userOpen && <AccountDropdown />}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full bg-white px-4 font-black"
                    onClick={() => goTo("/login")}
                  >
                    Log In
                  </Button>

                  <Button
                    className="h-11 rounded-full bg-blue-600 px-4 font-black text-white hover:bg-blue-700"
                    onClick={() => goTo("/register")}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>

          <nav
            className="hidden h-12 items-center justify-center border-t border-slate-100 xl:flex"
            aria-label="Marketplace navigation"
          >
            <div className="flex items-stretch gap-6">
              {primaryNav.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </div>
          </nav>

          <div className="md:hidden">
            <div className="grid h-16 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-800"
                aria-label="Open navigation"
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => goTo("/")}
                className="min-w-0 justify-self-start"
                aria-label="Go to homepage"
              >
                <img
                  src="/brand/ai-marketplace-traveler-logo.png"
                  alt="AI Marketplace Traveler"
                  className="h-9 w-auto max-w-[120px] object-contain min-[390px]:max-w-[150px]"
                />
              </button>

              <div className="flex shrink-0 items-center justify-end gap-1.5">
                <IconButton
                  label="Search"
                  icon={Search}
                  onClick={() => goTo("/search")}
                />

                <button
                  type="button"
                  onClick={() => goTo("/wishlist")}
                  className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-[390px]:flex"
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </button>

                <IconButton
                  label="Cart"
                  icon={ShoppingCart}
                  onClick={() => goTo("/cart")}
                  badge={cartCount > 0 ? String(Math.min(cartCount, 99)) : undefined}
                />

                <button
                  type="button"
                  className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-[390px]:flex"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    3
                  </span>
                </button>

                {isAuthenticated && user && (
                  <button
                    type="button"
                    onClick={() => setUserOpen(true)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-sm shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Open account menu"
                  >
                    {initials}
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => goTo("/search")}
              className="mb-3 flex h-12 w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-500 shadow-sm"
            >
              <Search className="h-5 w-5 text-slate-500" />
              <span className="min-w-0 flex-1 truncate">
                Search destinations, hotels, tours...
              </span>
              <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-slate-400">
                ⌘ K
              </span>
            </button>
          </div>
        </div>
      </header>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && <MobileNavigationSheet />}
          </AnimatePresence>,
          document.body,
        )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {userOpen && isAuthenticated && <MobileAccountSheet />}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export default SiteHeader;
