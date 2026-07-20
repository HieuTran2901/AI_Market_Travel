import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Car,
  ChevronDown,
  ChevronUp,
  Compass,
  CreditCard,
  ArrowRight,
  Bike as BikeIcon,
  Coffee as CoffeeIcon,
  Gift,
  Globe2,
  Grid2X2,
  Heart,
  HelpCircle,
  Headphones,
  Home as HomeIcon,
  Hotel,
  Lock,
  LogOut,
  Map,
  Menu,
  Plane,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket,
  Utensils,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/bookingService";
import { cn } from "@/lib/utils";
import coinImage from "../../assets/images/coin.png";
import coinGoldImage from "../../assets/images/coin-gold.png";

type HeaderLink = {
  label: string;
  to: string;
  icon?: React.ElementType;
  badge?: "Hot" | "New";
  menuKey?: CategoryMenuKey;
};

type CategoryMenuKey =
  | "explore"
  | "stays"
  | "tours"
  | "experiences"
  | "restaurants"
  | "vehicles"
  | "deals";

type HeaderDropdown = "explore" | "deals" | "ai-planner" | "categories" | null;

type CoinAnchorRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

const aiCoinPackages = [
  { amount: 200, price: "29.000 d", bonus: "+20 Bonus" },
  {
    amount: 500,
    price: "59.000 d",
    bonus: "+75 Bonus",
    badge: "Tiet kiem 15%",
  },
  { amount: 1000, price: "99.000 d", bonus: "+200 Bonus" },
  {
    amount: 2500,
    price: "249.000 d",
    bonus: "+500 Bonus",
    badge: "Best value",
  },
  { amount: 5000, price: "449.000 d", bonus: "+1,250 Bonus" },
];

type MegaMenuItem = {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: "Hot" | "New";
  description?: string;
  accent?: "blue" | "green" | "orange" | "purple" | "rose" | "slate";
};

type MegaMenuSection = {
  key: CategoryMenuKey | "more";
  label: string;
  items: MegaMenuItem[];
};

const primaryNav: HeaderLink[] = [
  { label: "Explore", to: "/search", icon: Grid2X2, menuKey: "explore" },
  {
    label: "Stays",
    to: "/search?category=HOTEL",
    icon: Hotel,
    menuKey: "stays",
  },
  {
    label: "Tours",
    to: "/search?category=TOUR",
    icon: Ticket,
    menuKey: "tours",
  },
  {
    label: "Experiences",
    to: "/search?category=EXPERIENCE",
    icon: Star,
    menuKey: "experiences",
  },
  {
    label: "Restaurants",
    to: "/search?category=RESTAURANT",
    icon: Utensils,
    menuKey: "restaurants",
  },
  {
    label: "Vehicles",
    to: "/search?category=VEHICLE",
    icon: Car,
    menuKey: "vehicles",
  },
  {
    label: "Deals",
    to: "/search?sort=deals",
    icon: Gift,
    badge: "Hot",
    menuKey: "deals",
  },
  { label: "AI Planner", to: "/ai/planner", icon: Sparkles, badge: "New" },
];

const megaMenuSections: MegaMenuSection[] = [
  {
    key: "stays",
    label: "Stays",
    items: [
      {
        label: "Hotels",
        to: "/search?category=HOTEL",
        icon: Hotel,
        description: "Comfort & convenience",
        accent: "purple",
      },
      {
        label: "Villas",
        to: "/search?category=HOTEL&keyword=villa",
        icon: HomeIcon,
        description: "Private luxury stays",
        accent: "purple",
      },
      {
        label: "Resorts",
        to: "/search?category=HOTEL&keyword=resort",
        icon: UsersIcon,
        description: "Relax & unwind",
        accent: "purple",
      },
      {
        label: "Apartments",
        to: "/search?category=HOTEL&keyword=apartment",
        icon: Grid2X2,
        description: "Feel at home anywhere",
        accent: "purple",
      },
    ],
  },
  {
    key: "tours",
    label: "Tours & Activities",
    items: [
      {
        label: "City Tours",
        to: "/search?category=TOUR&keyword=city",
        icon: Map,
        description: "Explore cities like a local",
        accent: "green",
      },
      {
        label: "Adventure Tours",
        to: "/search?category=TOUR&keyword=adventure",
        icon: Compass,
        description: "Thrill-seeking experiences",
        accent: "green",
      },
      {
        label: "Day Trips",
        to: "/search?category=TOUR&keyword=day",
        icon: ShieldCheck,
        description: "Perfect short getaways",
        accent: "green",
      },
      {
        label: "Activities",
        to: "/search?category=TOUR&keyword=activity",
        icon: BikeIcon,
        description: "Fun for everyone",
        accent: "green",
      },
    ],
  },
  {
    key: "experiences",
    label: "Experiences",
    items: [
      {
        label: "Things to Do",
        to: "/search?category=EXPERIENCE",
        icon: Star,
        description: "Top attractions & sights",
        accent: "orange",
      },
      {
        label: "Outdoor Adventures",
        to: "/search?category=EXPERIENCE&keyword=outdoor",
        icon: Compass,
        description: "Nature, hiking & more",
        accent: "orange",
      },
      {
        label: "Local Experiences",
        to: "/search?category=EXPERIENCE&keyword=local",
        icon: ShieldCheck,
        description: "Culture, heritage & more",
        accent: "orange",
      },
      {
        label: "Entertainment",
        to: "/search?category=EXPERIENCE&keyword=entertainment",
        icon: Gift,
        description: "Shows, events & more",
        accent: "orange",
      },
    ],
  },
  {
    key: "restaurants",
    label: "Restaurants",
    items: [
      {
        label: "Fine Dining",
        to: "/search?category=RESTAURANT&keyword=fine",
        icon: Star,
        description: "Premium dining places",
        accent: "rose",
      },
      {
        label: "Local Cuisine",
        to: "/search?category=RESTAURANT&keyword=local",
        icon: Utensils,
        description: "Authentic local flavors",
        accent: "rose",
      },
      {
        label: "Cafes",
        to: "/search?category=RESTAURANT&keyword=cafe",
        icon: CoffeeIcon,
        description: "Cozy cafes & coffee",
        accent: "rose",
      },
      {
        label: "Bars & Nightlife",
        to: "/search?category=RESTAURANT&keyword=bar",
        icon: Gift,
        description: "Pubs, bars & clubs",
        accent: "rose",
      },
    ],
  },
  {
    key: "vehicles",
    label: "Vehicles",
    items: [
      {
        label: "Car Rentals",
        to: "/search?category=VEHICLE",
        icon: Car,
        description: "Rent a car anywhere",
        accent: "blue",
      },
      {
        label: "Airport Transfers",
        to: "/search?category=VEHICLE&keyword=airport",
        icon: Plane,
        description: "On-time airport pickup",
        accent: "blue",
      },
      {
        label: "Private Drivers",
        to: "/search?category=VEHICLE&keyword=driver",
        icon: UsersIcon,
        description: "Ride with professionals",
        accent: "blue",
      },
      {
        label: "Bikes & Scooters",
        to: "/search?category=VEHICLE&keyword=bike",
        icon: BikeIcon,
        description: "Two-wheel exploration",
        accent: "blue",
      },
    ],
  },
  {
    key: "more",
    label: "More",
    items: [
      {
        label: "Travel Guides",
        to: "/search?sort=newest",
        icon: Map,
        description: "Expert tips & advice",
        accent: "purple",
      },
      {
        label: "Best Time to Travel",
        to: "/search?sort=recommended",
        icon: CalendarCheck,
        description: "Seasonal insights",
        accent: "blue",
      },
      {
        label: "Travel Inspiration",
        to: "/search?sort=rating_desc",
        icon: Sparkles,
        description: "Ideas for your next trip",
        accent: "blue",
      },
      {
        label: "View all categories",
        to: "/search",
        icon: Grid2X2,
        description: "Browse the marketplace",
        accent: "blue",
      },
    ],
  },
];

const secondaryNavItems: HeaderLink[] = [
  { label: "Explore", to: "/search", icon: Grid2X2, menuKey: "explore" },
  {
    label: "Deals",
    to: "/search?sort=deals",
    icon: Gift,
    badge: "Hot",
    menuKey: "deals",
  },
  { label: "AI Planner", to: "/ai/planner", icon: Sparkles, badge: "New" },
  { label: "All categories", to: "/search", icon: Compass },
];

const dealsMenuItems: MegaMenuItem[] = [
  {
    label: "Maldives Escape",
    to: "/search?sort=deals&keyword=maldives",
    icon: Hotel,
    description: "Up to 40% off",
    badge: "Hot",
  },
  {
    label: "Bali Adventure",
    to: "/search?sort=deals&keyword=bali",
    icon: Compass,
    description: "Up to 30% off",
  },
  {
    label: "Dubai Getaway",
    to: "/search?sort=deals&keyword=dubai",
    icon: Plane,
    description: "Up to 25% off",
    badge: "Hot",
  },
  {
    label: "Phuket Paradise",
    to: "/search?sort=deals&keyword=phuket",
    icon: Globe2,
    description: "Up to 35% off",
  },
];

const aiPlannerMenuItems: MegaMenuItem[] = [
  {
    label: "Build a trip",
    to: "/ai/planner",
    icon: CalendarCheck,
    description: "Create your perfect itinerary",
  },
  {
    label: "Smart recommendations",
    to: "/ai/planner",
    icon: Sparkles,
    description: "Personalized just for you",
  },
  {
    label: "Budget planner",
    to: "/ai/planner",
    icon: CreditCard,
    description: "Plan trips that fit your budget",
  },
  {
    label: "Itinerary generator",
    to: "/ai/planner",
    icon: Map,
    description: "Instant day-by-day plans",
  },
];

const allCategoryItems: MegaMenuItem[] = [
  {
    label: "Stays",
    to: "/search?category=HOTEL",
    icon: Hotel,
    accent: "purple",
  },
  {
    label: "Tours & Activities",
    to: "/search?category=TOUR",
    icon: Map,
    accent: "green",
  },
  {
    label: "Experiences",
    to: "/search?category=EXPERIENCE",
    icon: Star,
    accent: "orange",
  },
  {
    label: "Restaurants",
    to: "/search?category=RESTAURANT",
    icon: Utensils,
    accent: "rose",
  },
  {
    label: "Vehicles",
    to: "/search?category=VEHICLE",
    icon: Car,
    accent: "blue",
  },
  { label: "More", to: "/search", icon: Compass, accent: "slate" },
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

export const SiteHeaderV1: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const [coinsOpen, setCoinsOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] =
    React.useState<HeaderDropdown>(null);
  const [openCategory, setOpenCategory] =
    React.useState<CategoryMenuKey | null>(null);
  const [isSecondaryNavCollapsed, setIsSecondaryNavCollapsed] = React.useState(
    () =>
      typeof window === "undefined"
        ? false
        : window.sessionStorage.getItem("ai-travel-secondary-nav-collapsed") ===
          "true",
  );
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);
  const [coinAnchorRect, setCoinAnchorRect] =
    React.useState<CoinAnchorRect | null>(null);
  const secondaryNavRef = React.useRef<HTMLDivElement | null>(null);
  const coinsTriggerRef = React.useRef<HTMLButtonElement | null>(null);

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
    if (
      !userOpen &&
      !mobileOpen &&
      !openCategory &&
      !activeDropdown &&
      !coinsOpen
    )
      return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserOpen(false);
        setMobileOpen(false);
        setOpenCategory(null);
        setActiveDropdown(null);
        setCoinsOpen(false);
        coinsTriggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [userOpen, mobileOpen, openCategory, activeDropdown, coinsOpen]);

  React.useEffect(() => {
    if (!activeDropdown) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (secondaryNavRef.current?.contains(target)) return;
      setActiveDropdown(null);
    };

    window.addEventListener("pointerdown", onPointerDown);

    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [activeDropdown]);

  React.useEffect(() => {
    setOpenCategory(null);
    setActiveDropdown(null);
    setCoinsOpen(false);
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    if (!coinsOpen) return;

    const handleResize = () => {
      setCoinsOpen(false);
      setCoinAnchorRect(null);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [coinsOpen]);

  React.useEffect(() => {
    window.sessionStorage.setItem(
      "ai-travel-secondary-nav-collapsed",
      String(isSecondaryNavCollapsed),
    );
  }, [isSecondaryNavCollapsed]);

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
    setCoinsOpen(false);
    setOpenCategory(null);
    setActiveDropdown(null);
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
          "group relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold text-slate-200 transition-all duration-200 ease-out hover:bg-white/[0.055] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400",
          compact ? "flex-col gap-1 px-2 text-xs" : "px-5 py-3",
          item.label === "Deals" &&
            "text-rose-300 hover:bg-rose-400/10 hover:text-rose-200",
          item.label === "AI Planner" && "hover:bg-violet-400/10",
          isActive &&
            "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_6px_20px_rgba(37,99,235,0.30)] hover:from-blue-500 hover:to-blue-500",
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
                  ? "text-white"
                  : item.label === "Deals"
                    ? "text-rose-300 group-hover:text-rose-200"
                    : "text-slate-200 group-hover:text-white",
              )}
            />
          )}

          <span>{item.label}</span>

          {item.badge && (
            <span
              className={cn(
                "absolute -top-2 right-1 rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none",
                item.badge === "Hot"
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                  : "bg-gradient-to-r from-violet-500 to-purple-500 text-white",
              )}
            >
              {item.badge}
            </span>
          )}

          <span
            className={cn(
              "absolute -bottom-1 h-1 rounded-full bg-blue-300/80 transition-all duration-200",
              isActive ? "w-1" : "w-0",
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
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.035] text-slate-100 shadow-sm transition-all duration-200 ease-out hover:scale-[1.03] hover:border-blue-300/30 hover:bg-white/[0.10] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label={label}
    >
      <Icon className="h-5 w-5" />

      {badge && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-[#082752]">
          {badge}
        </span>
      )}
    </button>
  );

  const isCategoryActive = (item: HeaderLink) => {
    if (item.label === "AI Planner") {
      return location.pathname.startsWith("/ai/planner");
    }

    if (item.label === "Explore") {
      const params = new URLSearchParams(location.search);
      return (
        location.pathname === "/search" &&
        !params.get("category") &&
        params.get("sort") !== "deals"
      );
    }

    if (item.label === "Deals") {
      return (
        location.pathname === "/search" &&
        new URLSearchParams(location.search).get("sort") === "deals"
      );
    }

    const category = item.to.match(/category=([^&]+)/)?.[1];
    return (
      Boolean(category) &&
      location.pathname === "/search" &&
      new URLSearchParams(location.search).get("category") === category
    );
  };

  const getAccentClasses = (accent: MegaMenuItem["accent"] = "blue") => {
    switch (accent) {
      case "green":
        return "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100";
      case "orange":
        return "bg-orange-50 text-orange-500 group-hover:bg-orange-100";
      case "purple":
        return "bg-violet-50 text-violet-600 group-hover:bg-violet-100";
      case "rose":
        return "bg-rose-50 text-rose-500 group-hover:bg-rose-100";
      case "slate":
        return "bg-slate-100 text-slate-600 group-hover:bg-slate-200";
      default:
        return "bg-blue-50 text-blue-600 group-hover:bg-blue-100";
    }
  };

  const SecondaryNavItem = ({
    item,
    dropdown,
  }: {
    item: HeaderLink;
    dropdown: Exclude<HeaderDropdown, null>;
  }) => {
    const Icon = item.icon;
    const isOpen = activeDropdown === dropdown;
    const isActive = isCategoryActive(item) || isOpen;

    return (
      <button
        type="button"
        onClick={() => {
          setActiveDropdown((current) =>
            current === dropdown ? null : dropdown,
          );
        }}
        className={cn(
          "group relative inline-flex h-12 shrink-0 items-center gap-2.5 rounded-[18px] border border-slate-200/80 bg-white/95 px-4 text-sm font-semibold text-slate-800 shadow-[0_6px_18px_rgba(15,23,42,0.055)] transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/70 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 xl:px-5",
          isActive &&
            "border-blue-200 bg-blue-50 text-blue-600 shadow-[0_8px_22px_rgba(59,130,246,0.12)]",
          item.label === "Deals" &&
            !isActive &&
            "text-rose-500 hover:bg-rose-50 hover:text-rose-600",
          item.label === "AI Planner" &&
            !isActive &&
            "hover:bg-violet-50 hover:text-violet-600",
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {Icon && (
          <Icon
            className={cn(
              "h-[18px] w-[18px]",
              isActive
                ? "text-blue-600"
                : item.label === "Deals"
                  ? "text-rose-500"
                  : "text-slate-800 group-hover:text-blue-600",
            )}
          />
        )}

        <span>{item.label}</span>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-500 transition-transform duration-200 group-hover:text-blue-500",
            item.label === "Deals" && "text-rose-400",
            isOpen && "rotate-180 text-blue-500",
          )}
        />

        {item.badge && (
          <span
            className={cn(
              "absolute -top-3 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none text-white",
              item.badge === "Hot"
                ? "bg-gradient-to-r from-red-500 to-rose-500"
                : "bg-gradient-to-r from-violet-500 to-purple-500",
            )}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const ExploreMegaMenu = () => (
    <AnimatePresence>
      {activeDropdown === "explore" && (
        <>
          <motion.button
            type="button"
            aria-label="Close category menu"
            className="fixed inset-x-0 bottom-0 top-[142px] z-30 hidden cursor-default bg-slate-950/[0.08] backdrop-blur-[1px] md:block"
            onClick={() => setActiveDropdown(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />

          <motion.div
            className="absolute left-0 right-0 top-full z-50 hidden pt-1 md:block"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="mx-auto w-[min(94vw,1480px)] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/[0.98] shadow-[0_24px_70px_rgba(15,23,42,0.15)] backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-y-7 px-5 py-8 lg:grid-cols-3 xl:grid-cols-6">
                {megaMenuSections.map((section, sectionIndex) => (
                  <div
                    key={section.key}
                    className={cn(
                      "px-5 xl:px-6",
                      sectionIndex < megaMenuSections.length - 1 &&
                        "xl:border-r xl:border-slate-200/70",
                    )}
                  >
                    <p className="mb-4 text-xs font-bold uppercase tracking-wide text-blue-600">
                      {section.label}
                    </p>

                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;

                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => goTo(item.to)}
                            className="group flex w-full items-center gap-3 rounded-xl py-2 text-left transition-colors hover:bg-blue-50/60 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                                getAccentClasses(item.accent),
                              )}
                            >
                              <ItemIcon className="h-4 w-4" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-slate-800 group-hover:text-blue-600">
                                {item.label}
                              </span>
                              {item.description && (
                                <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                                  {item.description}
                                </span>
                              )}
                            </span>

                            {item.badge && (
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                                  item.badge === "Hot"
                                    ? "bg-gradient-to-r from-red-500 to-rose-500"
                                    : "bg-gradient-to-r from-violet-500 to-purple-500",
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-5 mb-5 flex items-center gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 px-6 py-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-slate-900">
                    Plan smarter with AI
                  </span>
                  <span className="mt-1 block text-sm font-medium text-slate-600">
                    Get personalized recommendations and build your perfect trip
                    in seconds.
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => goTo("/ai/planner")}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border border-blue-100 bg-white px-5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                >
                  Try AI Planner
                  <ChevronDown className="-rotate-90 h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const CompactDropdown = ({
    dropdown,
    children,
    className,
  }: {
    dropdown: Exclude<HeaderDropdown, null>;
    children: React.ReactNode;
    className?: string;
  }) => (
    <AnimatePresence>
      {activeDropdown === dropdown && (
        <div className="absolute left-1/2 top-[calc(100%+12px)] z-50 -translate-x-1/2">
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative w-[min(92vw,320px)] rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)]",
              className,
            )}
          >
            <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-slate-200/80 bg-white" />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const DealsDropdown = () => (
    <>
      <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-900">
        Today's top deals <span aria-hidden>🔥</span>
      </p>
      <div className="space-y-2">
        {dealsMenuItems.map((item, index) => (
          <button
            key={item.label}
            type="button"
            onClick={() => goTo(item.to)}
            className="group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-blue-50"
          >
            <img
              src={`/demo-images/${["hotel", "experience", "tour", "restaurant"][index]}.svg`}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-900 group-hover:text-blue-600">
                {item.label}
              </span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-blue-600">
                {item.description}
              </span>
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-bold",
                item.badge === "Hot"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-amber-50 text-amber-600",
              )}
            >
              {item.badge ?? "Limited"}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => goTo("/search?sort=deals")}
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-blue-100 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
      >
        View all deals
        <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );

  const AiPlannerDropdown = () => (
    <>
      <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-900">
        Plan smarter with AI{" "}
        <Sparkles className="ml-1 inline h-3 w-3 text-blue-600" />
      </p>
      <div className="space-y-2">
        {aiPlannerMenuItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => goTo(item.to)}
              className="group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-violet-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                <ItemIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  {item.label}
                </span>
                <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => goTo("/ai/planner")}
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-blue-100 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
      >
        Open AI Planner
        <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );

  const AllCategoriesDropdown = () => (
    <>
      <p className="mb-4 text-xs font-black uppercase tracking-wide text-slate-900">
        Browse categories
      </p>
      <div className="grid grid-cols-2 gap-3">
        {allCategoryItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => goTo(item.to)}
              className="group flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white text-center text-xs font-bold text-slate-800 transition-colors hover:border-blue-100 hover:bg-blue-50"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  getAccentClasses(item.accent),
                )}
              >
                <ItemIcon className="h-4 w-4" />
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => goTo("/search")}
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-blue-100 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
      >
        View all categories
        <ArrowRight className="h-4 w-4" />
      </button>
    </>
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

  const aiCoinsBalance = 2450;

  const AiCoinsTrigger = ({ compact = false }: { compact?: boolean }) => (
    <button
      type="button"
      onClick={(event) => {
        const trigger = event.currentTarget;
        const rect = trigger.getBoundingClientRect();

        coinsTriggerRef.current = trigger;
        setCoinAnchorRect({
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        });

        setCoinsOpen((open) => !open);
        setUserOpen(false);
        setActiveDropdown(null);
        setOpenCategory(null);
      }}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-full border border-amber-300/45 bg-[linear-gradient(135deg,rgba(92,58,10,0.46),rgba(15,23,42,0.38))] text-left text-amber-50 shadow-[0_0_24px_rgba(245,158,11,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200/70 hover:bg-white/[0.08] hover:shadow-[0_0_30px_rgba(245,158,11,0.24)] focus:outline-none focus:ring-2 focus:ring-amber-300/70",
        compact
          ? "flex h-11 w-11 items-center justify-center min-[390px]:w-auto min-[390px]:gap-2 min-[390px]:px-2.5"
          : "hidden h-11 items-center gap-2.5 px-2.5 pr-2 xl:flex",
      )}
      aria-label="Open AI Coins menu"
      aria-expanded={coinsOpen}
      aria-haspopup="menu"
      aria-controls="site-header-v1-ai-coins-menu"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 h-14 w-14 rounded-full bg-amber-300/15 blur-2xl"
      />
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full">
        <img
          src={coinGoldImage}
          alt=""
          draggable={false}
          className="h-7 w-7 object-contain"
        />
      </span>
      <span
        className={cn(
          "relative min-w-0 leading-tight",
          compact && "hidden min-[390px]:block",
        )}
      >
        <span className="block text-sm font-black tabular-nums text-white">
          {aiCoinsBalance.toLocaleString("en-US")}
        </span>
        <span className="block text-[10px] font-black text-amber-200">
          AI Coins
        </span>
      </span>
      {!compact && (
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/25 bg-slate-950/25">
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              coinsOpen && "rotate-180",
            )}
          />
        </span>
      )}
    </button>
  );

  const AiCoinsDropdown = () => {
    const rect = coinAnchorRect;

    const viewportWidth =
      typeof window === "undefined" ? 680 : window.innerWidth;

    const viewportHeight =
      typeof window === "undefined" ? 768 : window.innerHeight;

    const horizontalPadding = 16;
    const dropdownWidth = Math.min(640, viewportWidth - horizontalPadding * 2);

    const anchorCenter = rect ? rect.left + rect.width / 2 : viewportWidth / 2;

    const idealLeft = anchorCenter - dropdownWidth / 2;

    const left = Math.max(
      horizontalPadding,
      Math.min(idealLeft, viewportWidth - dropdownWidth - horizontalPadding),
    );

    const top = rect ? rect.bottom + 10 : 86;

    const maxHeight = Math.min(680, Math.max(360, viewportHeight - top - 16));

    return (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[2190] cursor-default bg-transparent"
          onClick={() => {
            setCoinsOpen(false);
            setCoinAnchorRect(null);
            coinsTriggerRef.current?.focus();
          }}
          aria-label="Close AI Coins menu"
        />
        <motion.div
          id="site-header-v1-ai-coins-menu"
          role="menu"
          initial={{ opacity: 0, y: -4, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.985 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[2200] flex overflow-hidden rounded-[24px] border border-slate-200/80 bg-white text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.22),0_8px_24px_rgba(15,23,42,0.10)] ring-1 ring-slate-900/5"
          style={{
            top,
            left,
            width: dropdownWidth,
            maxHeight,
            transformOrigin: "top center",
          }}
        >
          <div className="flex min-h-0 w-full flex-col overflow-hidden">
            <div className="grid shrink-0 gap-4 border-b border-slate-100 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={coinImage}
                  alt=""
                  draggable={false}
                  className="h-20 w-20 shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="text-3xl font-black tabular-nums tracking-tight text-slate-950">
                    {aiCoinsBalance.toLocaleString("en-US")}
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-500">
                    AI Coins
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white opacity-80 shadow-[0_12px_26px_rgba(37,99,235,0.24)] disabled:cursor-not-allowed"
                  role="menuitem"
                  title="AI Coins top-up is coming soon"
                >
                  Mua them AI Coins
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-2.5 text-blue-700">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-black">
                      Nap coin - Mo khoa trai nghiem
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      Thanh toan nhanh, nhan uu dai hon!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-color:rgba(148,163,184,0.45)_transparent] [scrollbar-width:thin]">
              <div className="grid border-b border-slate-100 md:grid-cols-3">
                {[
                  {
                    label: "Lich su giao dich",
                    to: "/payments/history",
                    icon: CreditCard,
                  },
                  {
                    label: "Uu dai & su kien",
                    to: "/search?sort=deals",
                    icon: Gift,
                  },
                  {
                    label: "Cach kiem AI Coins",
                    to: "/ai/planner",
                    icon: HelpCircle,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goTo(item.to)}
                    className="flex min-h-12 min-w-0 items-center gap-2.5 border-slate-100 px-3 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 md:border-r md:last:border-r-0"
                    role="menuitem"
                  >
                    <item.icon className="h-5 w-5 shrink-0 text-blue-600" />
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    <ChevronDown className="-rotate-90 h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>

              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-base font-black text-slate-950">
                    Chon goi phu hop voi ban
                  </p>
                  <button
                    type="button"
                    disabled
                    className="text-sm font-bold text-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Xem tat ca
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-5 pt-3 min-[560px]:grid-cols-3 min-[1260px]:grid-cols-5">
                  {aiCoinPackages.map((pack) => {
                    const hasBadge = Boolean(pack.badge);
                    const isBestValue = pack.badge === "Best value";

                    return (
                      <button
                        key={pack.amount}
                        type="button"
                        disabled
                        className={cn(
                          "relative min-w-0 overflow-visible rounded-2xl border bg-white px-2.5 pb-2.5 pt-4 text-center shadow-sm transition-all",
                          "hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed",
                          hasBadge
                            ? "z-10 border-violet-300 shadow-[0_8px_24px_rgba(124,58,237,0.12)]"
                            : "border-slate-200 hover:border-blue-200",
                        )}
                      >
                        {pack.badge && (
                          <span
                            className={cn(
                              "absolute left-1/2 top-0 z-20",
                              "-translate-x-1/2 -translate-y-1/2",
                              "inline-flex h-5 items-center justify-center",
                              "whitespace-nowrap rounded-md px-2.5",
                              "text-[8px] font-black uppercase tracking-wide text-white",
                              isBestValue
                                ? "bg-gradient-to-r from-violet-700 to-purple-500 shadow-[0_4px_12px_rgba(109,40,217,0.35)]"
                                : "bg-gradient-to-r from-fuchsia-600 to-violet-500 shadow-[0_4px_12px_rgba(192,38,211,0.30)]",
                            )}
                          >
                            {pack.badge}
                          </span>
                        )}

                        <img
                          src={coinGoldImage}
                          alt={`${pack.amount} AI Coins`}
                          draggable={false}
                          className="mx-auto h-10 w-10 object-contain"
                        />

                        <p className="mt-2 text-xl font-black tabular-nums text-slate-950">
                          {pack.amount.toLocaleString("en-US")}
                        </p>

                        <p className="text-xs font-bold text-slate-500">
                          AI Coins
                        </p>

                        <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-600">
                          {pack.bonus}
                        </span>

                        <p className="mt-2 whitespace-nowrap text-sm font-black text-slate-700">
                          {pack.price}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-violet-50 to-blue-50 p-3">
                  <div>
                    <p className="text-base font-black text-violet-800">
                      Tiet kiem hon voi goi lon hon!
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      Nhan bonus hap dan khi mua goi tu 2,500 AI Coins tro len.
                    </p>
                  </div>
                  <img
                    src={coinGoldImage}
                    alt=""
                    draggable={false}
                    className="hidden h-16 w-16 object-contain sm:block"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => goTo("/ai-coins")}
                  className="mt-4 flex h-11 items-center gap-2 rounded-full text-sm font-black text-slate-800 transition hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  Xem tat ca goi AI Coins
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </>
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
            {primaryNav.slice(0, 7).map((item) => {
              const section = megaMenuSections.find(
                (menuSection) => menuSection.key === item.menuKey,
              );
              const expanded = Boolean(
                item.menuKey && openCategory === item.menuKey,
              );

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      const nextKey = item.menuKey;

                      if (section && nextKey) {
                        setOpenCategory((current) =>
                          current === nextKey ? null : nextKey,
                        );
                        return;
                      }

                      goTo(item.to);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    aria-expanded={section ? expanded : undefined}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span className="flex-1">{item.label}</span>
                    {section && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-slate-400 transition-transform",
                          expanded && "rotate-180 text-blue-600",
                        )}
                      />
                    )}
                  </button>

                  {section && expanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-blue-100 pl-3">
                      {section.items.map((subItem) => (
                        <button
                          key={subItem.label}
                          type="button"
                          onClick={() => goTo(subItem.to)}
                          className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <subItem.icon className="h-3.5 w-3.5 text-blue-600" />
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
      <header className="sticky top-0 z-50 overflow-visible">
        <div
          className={cn(
            "relative border-b border-white/[0.08] bg-[linear-gradient(135deg,rgba(3,12,36,0.98),rgba(5,18,55,0.98))] shadow-[0_8px_26px_rgba(15,23,42,0.14)] transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_55%_-20%,rgba(59,130,246,0.14),transparent_45%)]",
            scrolled ? "backdrop-blur-xl" : "backdrop-blur-md",
          )}
        >
          <div className="relative mx-auto max-w-[1640px] px-3 sm:px-5 lg:px-6 xl:px-8">
            <div className="hidden min-h-[78px] items-center gap-4 md:flex">
              <button
                type="button"
                onClick={() => goTo("/")}
                className="group flex w-[190px] shrink-0 rounded-full pr-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#082b58] xl:w-[220px]"
                aria-label="Go to AI Marketplace Traveler homepage"
              >
                <img
                  src="/brand/ai-marketplace-traveler-logo.png"
                  alt="AI Marketplace Traveler"
                  className="h-11 w-auto max-w-[178px] object-contain brightness-0 invert transition-transform group-hover:scale-[1.02] xl:h-12 xl:max-w-[205px]"
                />
              </button>

              <button
                type="button"
                onClick={() => goTo("/search")}
                className="flex h-12 min-w-0 max-w-[650px] flex-1 items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.06] px-5 text-left text-sm font-medium text-slate-300 shadow-sm backdrop-blur-md transition-all hover:bg-white/[0.09] focus-within:border-blue-400/60 focus-within:bg-white/[0.10] focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.10)] focus:outline-none focus:ring-2 focus:ring-blue-400 xl:max-w-[720px]"
              >
                <Search className="h-5 w-5 shrink-0 text-slate-300" />
                <span className="truncate">
                  Search destinations, hotels, tours...
                </span>
                <span className="ml-auto rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-black text-slate-300">
                  ⌘ K
                </span>
              </button>

              <nav className="hidden" aria-label="Tablet navigation">
                <div className="grid grid-cols-6 gap-1">
                  {tabletNav.map((item) => (
                    <NavItem key={item.label} item={item} compact />
                  ))}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMoreOpen((open) => !open)}
                      className="relative inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                <AiCoinsTrigger />

                <Button
                  variant="outline"
                  className="hidden h-11 rounded-full border-0 bg-gradient-to-r from-blue-600 to-blue-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-500 hover:to-cyan-500 hover:text-white xl:inline-flex"
                  onClick={() => goTo("/register")}
                >
                  <BriefcaseBusiness className="mr-2 h-4 w-4" />
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
                  badge={
                    cartCount > 0 ? String(Math.min(cartCount, 99)) : undefined
                  }
                />
                <IconButton label="Notifications" icon={Bell} badge="3" />

                {isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setCoinsOpen(false);
                        setUserOpen((open) => !open);
                      }}
                      className="flex h-11 items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.035] py-1 pl-1 pr-3 text-sm font-semibold text-slate-100 shadow-sm transition-all duration-200 hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-expanded={userOpen}
                      aria-haspopup="menu"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-sm shadow-blue-500/20">
                        {initials}
                      </span>
                      <span className="hidden max-w-28 truncate xl:inline">
                        {displayName}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-300" />
                    </button>

                    <AnimatePresence>
                      {userOpen && <AccountDropdown />}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-11 rounded-full border-white/15 bg-white/[0.04] px-4 font-semibold text-slate-100 hover:bg-white/[0.10] hover:text-white"
                      onClick={() => goTo("/login")}
                    >
                      Log In
                    </Button>

                    <Button
                      className="h-11 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-4 font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.24)] hover:from-blue-500 hover:to-cyan-500"
                      onClick={() => goTo("/register")}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:hidden">
              <div className="grid h-16 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-100 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="h-9 w-auto max-w-[120px] object-contain brightness-0 invert min-[390px]:max-w-[150px]"
                  />
                </button>

                <div className="flex shrink-0 items-center justify-end gap-1.5">
                  <IconButton
                    label="Search"
                    icon={Search}
                    onClick={() => goTo("/search")}
                  />

                  <AiCoinsTrigger compact />

                  <button
                    type="button"
                    onClick={() => goTo("/wishlist")}
                    className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.035] text-slate-100 shadow-sm transition-all hover:scale-[1.03] hover:border-blue-300/30 hover:bg-white/[0.10] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-[390px]:flex"
                    aria-label="Wishlist"
                  >
                    <Heart className="h-5 w-5" />
                  </button>

                  <IconButton
                    label="Cart"
                    icon={ShoppingCart}
                    onClick={() => goTo("/cart")}
                    badge={
                      cartCount > 0
                        ? String(Math.min(cartCount, 99))
                        : undefined
                    }
                  />

                  <button
                    type="button"
                    className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.035] text-slate-100 shadow-sm transition-all hover:scale-[1.03] hover:border-blue-300/30 hover:bg-white/[0.10] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-[390px]:flex"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-black text-white ring-2 ring-[#082752]">
                      3
                    </span>
                  </button>

                  {isAuthenticated && user && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoinsOpen(false);
                        setUserOpen(true);
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-sm shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="mb-3 flex h-12 w-full items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 text-left text-sm font-semibold text-slate-300 shadow-sm backdrop-blur-md"
              >
                <Search className="h-5 w-5 text-slate-300" />
                <span className="min-w-0 flex-1 truncate">
                  Search destinations, hotels, tours...
                </span>
                <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-black text-slate-300">
                  ⌘ K
                </span>
              </button>
            </div>
          </div>
        </div>

        <motion.div
          ref={secondaryNavRef}
          initial={false}
          animate={
            isSecondaryNavCollapsed
              ? {
                  height: 0,
                  opacity: 0,
                  marginBottom: 0,
                  borderBottomWidth: 0,
                  transitionEnd: {
                    overflow: "hidden",
                    pointerEvents: "none",
                    visibility: "hidden",
                  },
                }
              : {
                  height: "auto",
                  opacity: 1,
                  marginBottom: 0,
                  borderBottomWidth: 1,
                  overflow: "visible",
                  pointerEvents: "auto",
                  visibility: "visible",
                }
          }
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden min-h-0 border-b border-slate-200/70 bg-white/95 shadow-[0_6px_18px_rgba(15,23,42,0.045)] backdrop-blur-xl md:block"
        >
          <motion.div
            initial={false}
            animate={
              isSecondaryNavCollapsed
                ? { y: -10, opacity: 0, paddingTop: 0, paddingBottom: 0 }
                : { y: 0, opacity: 1, paddingTop: 12, paddingBottom: 12 }
            }
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="mx-auto flex max-w-[1640px] items-center justify-center gap-4 px-3 sm:px-5 lg:px-6 xl:px-8"
          >
            <nav
              className="flex min-w-0 flex-wrap items-center justify-center gap-4 overflow-visible px-1"
              aria-label="Marketplace shortcuts"
            >
              <div className="relative shrink-0">
                <SecondaryNavItem
                  item={secondaryNavItems[0]}
                  dropdown="explore"
                />
              </div>

              <span className="h-8 w-px shrink-0 bg-slate-200/80" />

              <div className="relative shrink-0 overflow-visible">
                <SecondaryNavItem
                  item={secondaryNavItems[1]}
                  dropdown="deals"
                />
                <CompactDropdown dropdown="deals">
                  <DealsDropdown />
                </CompactDropdown>
              </div>

              <div className="relative shrink-0 overflow-visible">
                <SecondaryNavItem
                  item={secondaryNavItems[2]}
                  dropdown="ai-planner"
                />
                <CompactDropdown dropdown="ai-planner">
                  <AiPlannerDropdown />
                </CompactDropdown>
              </div>

              <span className="h-8 w-px shrink-0 bg-slate-200/80" />

              <div className="relative shrink-0 overflow-visible">
                <SecondaryNavItem
                  item={secondaryNavItems[3]}
                  dropdown="categories"
                />
                <CompactDropdown
                  dropdown="categories"
                  className="w-[min(92vw,300px)]"
                >
                  <AllCategoriesDropdown />
                </CompactDropdown>
              </div>
            </nav>

            <button
              type="button"
              onClick={() => {
                setActiveDropdown(null);
                setIsSecondaryNavCollapsed(true);
              }}
              className="ml-auto hidden items-center gap-2 rounded-full text-xs font-semibold text-slate-600 transition-colors hover:text-blue-600 lg:flex"
              aria-label="Collapse travel navigation"
            >
              Collapse
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
                <ChevronUp className="h-4 w-4" />
              </span>
            </button>
          </motion.div>
          {!isSecondaryNavCollapsed && <ExploreMegaMenu />}
        </motion.div>

        <AnimatePresence initial={false}>
          {isSecondaryNavCollapsed && (
            <motion.div
              key="secondary-nav-collapsed-control"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute right-6 top-full z-50 hidden justify-center md:flex lg:right-10 xl:right-14"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(null);
                  setIsSecondaryNavCollapsed(false);
                }}
                className="group flex h-7 w-14 items-center justify-center rounded-b-2xl border border-t-0 border-white/15 bg-slate-950/75 text-white/80 shadow-md backdrop-blur-md transition-all duration-300 hover:h-8 hover:bg-slate-900/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                aria-label="Expand travel navigation"
              >
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {mounted &&
        createPortal(
          <AnimatePresence>{coinsOpen && <AiCoinsDropdown />}</AnimatePresence>,
          document.body,
        )}

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

export default SiteHeaderV1;
