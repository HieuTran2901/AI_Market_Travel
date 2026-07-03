import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Gift,
  Globe2,
  Headphones,
  Heart,
  Home,
  Hotel,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket,
  Utensils,
  User,
  WalletCards,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: React.ElementType;
  active?: boolean;
};

type RecentBooking = {
  title: string;
  location: string;
  date: string;
  meta: string;
  price: string;
  status: "Upcoming" | "Completed";
  image: string;
};

type RecentReview = {
  title: string;
  rating: string;
  comment: string;
  date: string;
  image: string;
};

type WishlistItem = {
  title: string;
  location: string;
  price: string;
  image: string;
};

const recentBookings: RecentBooking[] = [
  {
    title: "Ocean View Resort Da Nang",
    location: "Da Nang, Vietnam",
    date: "Jun 30 - Jul 1, 2026",
    meta: "1 room, 2 guests",
    price: "320 USD",
    status: "Upcoming",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=320&q=80",
  },
  {
    title: "Ha Long Bay Day Cruise",
    location: "Quang Ninh, Vietnam",
    date: "Jun 15, 2026",
    meta: "2 adults",
    price: "120 USD",
    status: "Completed",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=320&q=80",
  },
  {
    title: "Singapore City Tour",
    location: "Singapore",
    date: "Jul 5, 2026",
    meta: "2 adults",
    price: "180 USD",
    status: "Completed",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=320&q=80",
  },
];

const recentReviews: RecentReview[] = [
  {
    title: "Ocean View Resort Da Nang",
    rating: "4.8",
    comment: "Amazing stay. The room was clean and the view was spectacular.",
    date: "Jul 2, 2026",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=240&q=80",
  },
  {
    title: "Ha Long Bay Cruise",
    rating: "4.7",
    comment: "Great experience with beautiful scenery and friendly staff.",
    date: "Jun 16, 2026",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=240&q=80",
  },
  {
    title: "Singapore City Tour",
    rating: "4.9",
    comment: "Very informative tour and well organized. Highly recommend.",
    date: "Jul 6, 2026",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=240&q=80",
  },
];

const wishlistItems: WishlistItem[] = [
  {
    title: "Luxury Beach Villa",
    location: "Phu Quoc, Vietnam",
    price: "250 USD / night",
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=240&q=80",
  },
  {
    title: "Bali Adventure Tour",
    location: "Bali, Indonesia",
    price: "95 USD / person",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=240&q=80",
  },
  {
    title: "Mountain View Resort",
    location: "Sapa, Vietnam",
    price: "180 USD / night",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=240&q=80",
  },
];

const overviewNav: NavItem[] = [
  { label: "Profile Overview", icon: User, active: true },
  { label: "My Bookings", icon: CalendarDays },
  { label: "Payments", icon: CreditCard },
  { label: "Reviews", icon: Star },
  { label: "Wishlist", icon: Heart },
];

const accountNav: NavItem[] = [
  { label: "Personal Information", icon: User },
  { label: "Security", icon: ShieldCheck },
  { label: "Notification Settings", icon: Bell },
  { label: "Saved Addresses", icon: MapPin },
  { label: "Payment Methods", icon: WalletCards },
];

const providerNav: NavItem[] = [
  { label: "Provider Dashboard", icon: ShoppingBag },
  { label: "Manage Listings", icon: Settings },
  { label: "Settlements", icon: CreditCard },
];

function initialsFromName(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AI"
  );
}

function SidebarNavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold transition-all",
              item.active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SidebarNav({ showProvider }: { showProvider: boolean }) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-32 space-y-4">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-7 p-4">
            <SidebarNavSection title="Overview" items={overviewNav} />
            <SidebarNavSection title="Account" items={accountNav} />
            {showProvider && <SidebarNavSection title="Provider" items={providerNav} />}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-blue-100 bg-blue-50/70 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-black text-slate-950">Become a Provider</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              List your properties and start earning with AI Travel.
            </p>
            <Button className="mt-4 h-10 rounded-2xl bg-blue-600 px-4 text-xs font-black text-white">
              Get Started
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-black text-slate-950">Need help?</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Visit our Help Center. We are here to assist 24/7.
            </p>
            <Button variant="outline" className="mt-4 h-10 rounded-2xl bg-white text-xs font-black">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}

type HeaderMenuItem = {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: "Hot" | "New";
};

const profileAccountMenu: HeaderMenuItem[] = [
  { label: "Profile", to: "/profile", icon: User },
  { label: "My Bookings", to: "/profile", icon: CalendarDays },
  { label: "Wishlist", to: "/wishlist", icon: Heart },
  { label: "Payments", to: "/payments/history", icon: CreditCard },
  { label: "Settings", to: "/profile", icon: Settings },
];

const profileMarketplaceMenu: HeaderMenuItem[] = [
  { label: "Explore", to: "/search", icon: Search },
  { label: "Stays", to: "/search?category=HOTEL", icon: Hotel },
  { label: "Tours", to: "/search?category=TOUR", icon: Ticket },
  { label: "Experiences", to: "/search?category=EXPERIENCE", icon: Star },
  { label: "Restaurants", to: "/search?category=RESTAURANT", icon: Utensils },
  { label: "Vehicles", to: "/search?category=VEHICLE", icon: Car },
  { label: "Deals", to: "/search?sort=deals", icon: Gift, badge: "Hot" },
  { label: "AI Planner", to: "/ai/planner", icon: Sparkles, badge: "New" },
];

const profileProviderMenu: HeaderMenuItem[] = [
  { label: "Provider Dashboard", to: "/provider/dashboard", icon: ShoppingBag },
  { label: "Manage Listings", to: "/provider/listings", icon: Settings },
  { label: "Settlements", to: "/provider/settlements", icon: CreditCard },
];

function ResponsiveProfileHeader({
  initials,
  displayName,
  email,
  showProvider,
  onLogout,
}: {
  initials: string;
  displayName: string;
  email: string;
  showProvider: boolean;
  onLogout: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const avatarMenuRef = React.useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isAvatarMenuOpen && !isMobileMenuOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const targetElement = event.target as Element;

      if (
        targetElement.closest('[data-profile-menu-trigger="true"]') ||
        avatarMenuRef.current?.contains(target) ||
        mobileMenuRef.current?.contains(target)
      ) {
        return;
      }

      setIsAvatarMenuOpen(false);
      setIsMobileMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAvatarMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAvatarMenuOpen, isMobileMenuOpen]);

  const closeMenus = () => {
    setIsAvatarMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const goTo = (path: string) => {
    closeMenus();
    navigate(path);
  };

  const handleLogout = async () => {
    await onLogout();
    closeMenus();
    navigate("/login");
  };

  const MenuRow = ({ item }: { item: HeaderMenuItem }) => (
    <button
      key={item.label}
      type="button"
      onClick={() => goTo(item.to)}
      className="group flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-slate-800 transition-all hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
        <item.icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-black",
            item.badge === "Hot"
              ? "bg-red-500 text-white"
              : "bg-violet-100 text-violet-700",
          )}
        >
          {item.badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
    </button>
  );

  const AccountDropdown = () => (
    <motion.div
      ref={avatarMenuRef}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-3 top-[84px] z-[9999] max-h-[calc(100vh-104px)] w-[calc(100vw-24px)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15 md:inset-x-auto md:right-6 md:top-[92px] md:w-[360px] md:max-w-[calc(100vw-48px)]"
      role="menu"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-blue-50/70 p-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/25">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-slate-950">
            {displayName}
          </span>
          <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
            {email}
          </span>
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-blue-700 shadow-sm ring-1 ring-blue-100">
          {showProvider ? "Provider" : "Member"}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {profileAccountMenu.map((item) => (
          <MenuRow key={item.label} item={item} />
        ))}
      </div>

      <div className="mt-2 border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-black text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
            <LogOut className="h-4 w-4" />
          </span>
          Logout
        </button>
      </div>
    </motion.div>
  );

  const NavigationDropdown = () => {
    const navItems = showProvider
      ? [...profileMarketplaceMenu, ...profileProviderMenu]
      : [...profileMarketplaceMenu];

    return (
      <motion.div
        ref={mobileMenuRef}
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.99 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-3 top-[84px] z-[9999] max-h-[calc(100vh-104px)] w-[calc(100vw-24px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 md:top-[92px]"
        role="menu"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">Explore AI Travel</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Search, book, and manage your marketplace trips.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-210px)] overflow-y-auto p-3">
          <div className="grid gap-1 sm:grid-cols-2">
            {navItems.map((item) => (
              <MenuRow key={item.label} item={item} />
            ))}
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
    );
  };

  return (
    <>
      <div className="box-border flex h-16 w-full max-w-full items-center justify-between gap-1.5 overflow-hidden rounded-full border border-slate-200 bg-white px-3 shadow-sm md:h-auto md:gap-2 md:overflow-visible md:rounded-3xl md:px-4 md:py-3 md:shadow-lg md:shadow-slate-200/70">
        <div className="flex min-w-0 shrink items-center gap-2 md:shrink-0 md:gap-3">
          <button
            type="button"
            data-profile-menu-trigger="true"
            onClick={() => {
              setIsMobileMenuOpen((open) => !open);
              setIsAvatarMenuOpen(false);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 md:h-11 md:w-11"
            aria-label="Open profile navigation"
            aria-expanded={isMobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => goTo("/")}
            className="min-w-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go to AI Travel Marketplace homepage"
          >
            <img
              src="/brand/ai-marketplace-traveler-logo.png"
              alt="AI Travel Marketplace"
              className="h-7 w-auto min-w-0 max-w-[88px] shrink object-contain md:h-9 md:max-w-[140px] md:shrink-0"
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => goTo("/search")}
          className="hidden h-11 min-w-0 max-w-[360px] flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 text-left text-sm font-semibold text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 md:flex"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search destinations, hotels, tours...</span>
        </button>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={() => goTo("/search")}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-50 min-[380px]:flex md:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button type="button" className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-700 xl:flex">
            <Globe2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo("/wishlist")}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-50 min-[380px]:flex md:h-10 md:w-10"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo("/cart")}
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-50 md:h-10 md:w-10"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">
              1
            </span>
          </button>
          <button
            type="button"
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-50 md:h-10 md:w-10"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
              2
            </span>
          </button>
          <button
            type="button"
            data-profile-menu-trigger="true"
            onClick={() => {
              setIsAvatarMenuOpen((open) => !open);
              setIsMobileMenuOpen(false);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 md:h-10 md:w-10"
            aria-label="Open account menu"
            aria-expanded={isAvatarMenuOpen}
          >
            {initials}
          </button>
        </div>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isAvatarMenuOpen && <AccountDropdown />}
            {isMobileMenuOpen && <NavigationDropdown />}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function TabletSidebar({ showProvider }: { showProvider: boolean }) {
  const navGroups = [
    ["Overview", overviewNav],
    ["Account", accountNav],
    ...(showProvider ? ([["Provider", providerNav]] as [string, NavItem[]][]) : []),
  ] as [string, NavItem[]][];

  return (
    <aside className="hidden md:block xl:hidden">
      <Card className="sticky top-24 rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-6 p-3">
          {navGroups.map(([title, items]) => (
            <div key={title}>
              <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                {title}
              </p>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={cn(
                      "flex min-h-10 w-full items-center gap-2.5 rounded-2xl px-2.5 text-left text-xs font-black transition-all",
                      item.active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function ProfileHero({
  name,
  email,
  phone,
  initials,
  provider,
}: {
  name: string;
  email: string;
  phone: string;
  initials: string;
  provider: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-0">
        <div className="relative min-h-[176px] overflow-hidden bg-slate-950 md:min-h-[230px] xl:min-h-[250px]">
          <img
            src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80"
            alt="Travel profile banner"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-blue-950/20" />

          <div className="relative flex min-h-[176px] flex-col justify-end gap-4 p-4 text-white md:min-h-[230px] md:flex-row md:items-end md:justify-between md:p-6 xl:min-h-[250px] xl:p-8">
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-end md:gap-4">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-2xl font-black shadow-xl md:h-32 md:w-32 md:text-3xl">
                  {initials}
                </div>
                <button
                  type="button"
                  className="absolute bottom-2 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-slate-700 shadow-lg"
                  aria-label="Change avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight md:text-3xl">{name}</h1>
                  <span className="rounded-full bg-blue-500 px-2.5 py-1 text-[11px] font-black">
                    Explorer
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {provider ? "Provider" : "Verified"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-white/90 md:mt-3 md:gap-x-5 md:gap-y-2 md:text-xs">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {email}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Da Nang, Vietnam
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Joined May 2024
                  </span>
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {phone}
                  </span>
                </div>
              </div>
            </div>

            <Button className="h-11 w-full rounded-2xl bg-white px-5 font-black text-slate-900 shadow-lg hover:bg-blue-50 md:w-auto md:self-end">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  tone,
  action,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  tone: "blue" | "emerald" | "amber" | "violet";
  action: string;
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  }[tone];

  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/40">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-4">
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", toneClass)}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-black text-slate-950">{value}</p>
            <p className="text-xs font-semibold text-slate-500">{title}</p>
          </div>
        </div>
        <button className="mt-5 hidden text-xs font-black text-blue-700 hover:underline xl:inline-flex">
          {action}
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}

function MobileStatsTable() {
  const stats = [
    {
      label: "Bookings",
      value: "12",
      icon: ShoppingBag,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Spent",
      value: "$2,450",
      icon: WalletCards,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Rating",
      value: "4.8",
      icon: Star,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Wishlist",
      value: "24",
      icon: Heart,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:hidden">
      <div className="grid grid-cols-2">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex min-w-0 items-center gap-3 p-4",
              index % 2 === 0 && "border-r border-slate-100",
              index < 2 && "border-b border-slate-100",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                stat.tone,
              )}
            >
              <stat.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-black leading-tight text-slate-950">
                {stat.value}
              </span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                {stat.label}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  action = "View all",
  children,
  className,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 rounded-3xl border-slate-200 bg-white shadow-sm", className)}>
      <CardContent className="p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          <button type="button" className="text-xs font-black text-blue-700 hover:underline">
            {action}
          </button>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function RecentBookingCard({ booking, compact = false }: { booking: RecentBooking; compact?: boolean }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl p-2 transition-all hover:bg-blue-50/60">
      <img
        src={booking.image}
        alt={booking.title}
        className={cn("shrink-0 rounded-2xl object-cover", compact ? "h-16 w-20" : "h-20 w-24")}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">{booking.title}</p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{booking.location}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-1 text-[10px] font-black",
              booking.status === "Upcoming"
                ? "bg-blue-50 text-blue-700"
                : "bg-emerald-50 text-emerald-700",
            )}
          >
            {booking.status}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {booking.date}
          </span>
          <span>{booking.meta}</span>
        </div>
      </div>
      <p className="hidden shrink-0 text-sm font-black text-slate-950 sm:block">{booking.price}</p>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </div>
  );
}

function RecentReviewCard({ review }: { review: RecentReview }) {
  return (
    <div className="flex gap-3 rounded-2xl p-2 transition-all hover:bg-blue-50/60">
      <img src={review.image} alt={review.title} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-950">{review.title}</p>
        <div className="mt-1 flex items-center gap-1 text-xs font-black text-slate-700">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="ml-1">{review.rating}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{review.comment}</p>
      </div>
      <p className="hidden shrink-0 text-xs font-semibold text-slate-400 xl:block">{review.date}</p>
    </div>
  );
}

function WishlistCard({ item }: { item: WishlistItem }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-2 transition-all hover:bg-blue-50/60">
      <img src={item.image} alt={item.title} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-950">{item.title}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{item.location}</p>
        <p className="mt-1 text-xs font-black text-slate-950">{item.price}</p>
      </div>
      <Heart className="h-4 w-4 shrink-0 text-red-500" />
    </div>
  );
}

function QuickActions() {
  const actions = [
    ["My Bookings", "View and manage your trips", CalendarDays],
    ["Payment Methods", "Manage your cards and payments", CreditCard],
    ["Saved Addresses", "View and edit your addresses", MapPin],
    ["Notification Settings", "Manage email and push alerts", Bell],
    ["Security", "Update password and security settings", ShieldCheck],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-2">
      {actions.map(([title, description, Icon]) => (
        <button
          key={title}
          type="button"
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/50 md:flex-col md:items-center md:text-center xl:flex-row xl:items-center xl:text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-slate-950">{title}</span>
            <span className="line-clamp-1 text-xs text-slate-500 md:text-[11px] xl:text-xs">{description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function RewardCard({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <Card className="overflow-hidden rounded-3xl border-blue-900/20 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 text-white shadow-xl shadow-blue-900/20">
      <CardContent
        className={cn(
          "relative p-6",
          horizontal && "md:flex md:items-center md:justify-between md:gap-6",
        )}
      >
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">AI Travel Member</p>
          <h2 className="mt-3 text-xl font-black">You are earning points!</h2>
          <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-blue-100">
            You will earn 682 points on your next booking.
          </p>
          <Button className="mt-5 h-11 rounded-2xl bg-white px-5 font-black text-blue-700 hover:bg-blue-50">
            View My Rewards
          </Button>
        </div>
        <Gift className="absolute bottom-4 right-5 h-24 w-24 text-blue-300/50" />
      </CardContent>
    </Card>
  );
}

function MobileCollapsedRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left shadow-sm"
    >
      <span className="flex items-center gap-3 text-sm font-black text-slate-950">
        <Icon className="h-4 w-4 text-blue-600" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  );
}

function BenefitsStrip() {
  const benefits = [
    ["Best Price Guarantee", "We will match any lower price", ShieldCheck],
    ["Free Cancellation", "On most items", CheckCircle2],
    ["Secure Payment", "Your payment is protected", Lock],
    ["24/7 Support", "We are here to help", Headphones],
  ] as const;

  return (
    <Card className="rounded-3xl border-slate-200 bg-white/95 shadow-sm">
      <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map(([title, description, Icon]) => (
          <div key={title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">{title}</p>
              <p className="text-xs font-medium text-slate-500">{description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MobileBottomNav() {
  const items = [
    ["Home", Home],
    ["Explore", Search],
    ["Bookings", CalendarDays],
    ["Wishlist", Heart],
    ["Profile", User],
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-2xl shadow-slate-900/10 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map(([label, Icon]) => (
          <button
            key={label}
            type="button"
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold",
              label === "Profile" ? "text-blue-700" : "text-slate-500",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function MobileProfileExtras() {
  return (
    <div className="space-y-3 md:hidden">
      <MobileCollapsedRow icon={Star} label="Recent Reviews" />
      <MobileCollapsedRow icon={Heart} label="Wishlist Preview" />
      <MobileCollapsedRow icon={Settings} label="Quick Actions" />
      <RewardCard />
    </div>
  );
}

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md rounded-3xl border-blue-100 bg-white text-center shadow-xl shadow-blue-100/40">
          <CardContent className="p-8">
            <User className="mx-auto h-10 w-10 text-blue-600" />
            <h1 className="mt-4 text-xl font-black text-slate-950">Please log in to view your profile.</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = user.fullName || user.email || "AI Traveler";
  const initials = initialsFromName(displayName);
  const phone = user.phoneNumber || "+84 912 345 678";
  const showProvider = Boolean(user.providerProfile || user.roles?.some((role) => role.startsWith("ROLE_PROVIDER")));
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-blue-50/30 to-white pb-24 md:pb-10">
      <div className="hidden xl:block">
        <SiteHeader />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-4 pt-4 sm:px-6 xl:hidden">
        <ResponsiveProfileHeader
          initials={initials}
          displayName={displayName}
          email={user.email}
          showProvider={showProvider}
          onLogout={handleLogout}
        />
      </div>

      <main className="mx-auto grid w-full max-w-screen-xl grid-cols-1 gap-0 px-4 py-4 sm:px-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:max-w-[1440px] xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-6 xl:px-8 xl:py-6">
        <TabletSidebar showProvider={showProvider} />
        <SidebarNav showProvider={showProvider} />

        <div className="min-w-0 space-y-5">
          <ProfileHero
            name={displayName}
            email={user.email}
            phone={phone}
            initials={initials}
            provider={showProvider}
          />

          <MobileStatsTable />

          <div className="hidden grid-cols-2 gap-3 md:grid xl:grid-cols-4 xl:gap-4">
            <StatsCard title="Total Bookings" value="12" icon={ShoppingBag} tone="blue" action="View all bookings" />
            <StatsCard title="Total Spent" value="$2,450" icon={WalletCards} tone="emerald" action="View spending" />
            <StatsCard title="Average Rating" value="4.8" icon={Star} tone="amber" action="See reviews" />
            <StatsCard title="Wishlist Items" value="24" icon={Heart} tone="violet" action="View wishlist" />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)]">
            <SectionCard title="Recent Bookings">
              <div className="space-y-2">
                {recentBookings.map((booking) => (
                  <RecentBookingCard key={booking.title} booking={booking} />
                ))}
              </div>
            </SectionCard>

            <div className="hidden space-y-5 md:block">
              <SectionCard title="Recent Reviews">
                <div className="space-y-2">
                  {recentReviews.map((review) => (
                    <RecentReviewCard key={review.title} review={review} />
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>

          <div className="hidden gap-5 xl:grid xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_280px]">
            <SectionCard title="Wishlist Preview">
              <div className="space-y-2">
                {wishlistItems.map((item) => (
                  <WishlistCard key={item.title} item={item} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Quick Actions" action="Manage">
              <QuickActions />
            </SectionCard>

            <RewardCard />
          </div>

          <div className="hidden min-w-0 gap-5 md:grid md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] xl:hidden">
            <SectionCard title="Quick Actions" action="Manage">
              <QuickActions />
            </SectionCard>
            <RewardCard />
          </div>

          <MobileProfileExtras />

          <div className="hidden md:block">
            <BenefitsStrip />
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Profile;
