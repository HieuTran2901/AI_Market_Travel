import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  Globe2,
  Headphones,
  Heart,
  Home,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Plane,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  User as UserIcon,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StateBlock } from "../../components/ui/StateBlock";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { PaymentTimeline } from "../../components/payment/PaymentTimeline";
import { DevControls } from "../../components/payment/DevControls";
import coinGoldImage from "../../assets/images/coin-gold.png";
import paymentListingSuccessImage from "../../assets/images/payment_listing_success.png";
import { bookingService } from "../../services/bookingService";
import { paymentService } from "../../services/paymentService";
import { useAuth } from "../../context/AuthContext";
import { useAiCoinWallet } from "../../hooks/useAiCoinWallet";
import { cn } from "../../lib/utils";
import { submitSePayCheckout } from "../../utils/submitSePayCheckout";
import {
  Cart,
  CartItem,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PriceBreakdownDto,
} from "../../types/payment";
import {
  getAiCoinBreakdown,
  type AiCoinBreakdown,
} from "./checkoutAiCoins";

type CheckoutStep = "details" | "payment" | "review" | "processing" | "result";
type DevOutcome = "success" | "failed" | "expired";

type ListingBankTransferPaymentSession = {
  flowType?: "LISTING_BOOKING";
  orderId?: number;
  paymentId?: number;
  listingId?: number | null;
  paymentMethod?: PaymentMethod;
  provider?: "SEPAY";
  checkoutStep?: CheckoutStep;
  originRoute?: string;
};

const MotionButton = motion(Button);

type PaymentMethodOption = {
  value: PaymentMethod;
  label: string;
  description: string;
  badge: string;
  disabled?: boolean;
  featuredLabel?: string;
};

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    value: PaymentMethod.MOCK,
    label: "Mock Payment",
    description: "Instant test payment through MockPaymentGateway",
    badge: "CARD",
  },
  {
    value: PaymentMethod.VNPAY,
    label: "VNPay",
    description: "Vietnam bank transfer and QR payment, coming soon",
    badge: "VNPAY",
    disabled: true,
  },
  {
    value: PaymentMethod.MOMO,
    label: "MoMo",
    description: "Vietnam mobile wallet",
    badge: "MoMo",
    featuredLabel: "Sandbox",
  },
  {
    value: PaymentMethod.PAYPAL,
    label: "PayPal",
    description: "International wallet payment, coming soon",
    badge: "PayPal",
    disabled: true,
  },
  {
    value: PaymentMethod.STRIPE,
    label: "ZaloPay",
    description: "Vietnam mobile wallet, coming soon",
    badge: "ZALOPAY",
    disabled: true,
  },
  {
    value: PaymentMethod.AI_COINS,
    label: "AI Coins",
    description: "Pay with your coins",
    badge: "AI_COINS",
    featuredLabel: "Best value",
  },
];

const EXTRA_PAYMENT_OPTIONS = [
  {
    id: "BANK",
    title: "Bank Transfer",
    description: "Manual bank transfer",
    logo: "BANK",
  },
  {
    id: "APPLE",
    title: "Apple Pay",
    description: "Fast and secure payment",
    logo: "APPLE",
  },
  {
    id: "GOOGLE",
    title: "Google Pay",
    description: "Fast and secure payment",
    logo: "GOOGLE",
  },
  {
    id: "STRIPE",
    title: "Stripe",
    description: "Credit / debit card",
    logo: "STRIPE",
  },
  {
    id: "UNIONPAY",
    title: "UnionPay",
    description: "International card payment",
    logo: "UNIONPAY",
  },
  {
    id: "JCB",
    title: "JCB",
    description: "International card payment",
    logo: "JCB",
  },
  {
    id: "ALIPAY",
    title: "Alipay",
    description: "Global digital wallet",
    logo: "ALIPAY",
  },
  {
    id: "PAYOO",
    title: "Payoo",
    description: "Vietnam payment network",
    logo: "PAYOO",
  },
  {
    id: "DINERS",
    title: "Diners Club",
    description: "International card payment",
    logo: "DINERS",
  },
  {
    id: "MORE",
    title: "View all",
    description: "More payment options",
    logo: "MORE",
  },
] as const;
const CHECKOUT_STEPS: Array<{
  key: CheckoutStep;
  title: string;
  subtitle: string;
}> = [
  { key: "details", title: "Details", subtitle: "Enter your information" },
  { key: "payment", title: "Payment", subtitle: "Choose payment method" },
  { key: "review", title: "Review", subtitle: "Review your booking" },
  { key: "result", title: "Confirmation", subtitle: "Booking confirmed" },
];

const CHECKOUT_NAV_ITEMS = [
  { label: "Explore", to: "/search", icon: Search },
  { label: "Stays", to: "/search?category=HOTEL" },
  { label: "Tours", to: "/search?category=TOUR" },
  { label: "Experiences", to: "/search?category=EXPERIENCE" },
  { label: "AI Planner", to: "/ai/planner", icon: Bot },
];

function saveRecentPaymentId(id: number) {
  const current = JSON.parse(
    localStorage.getItem("recent_payment_ids") || "[]",
  ) as number[];
  const next = [id, ...current.filter((existing) => existing !== id)].slice(
    0,
    10,
  );
  localStorage.setItem("recent_payment_ids", JSON.stringify(next));
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const candidate = error as {
      message?: string;
      errors?: Record<string, string>;
      response?: {
        data?: { message?: string; errors?: Record<string, string> };
      };
    };
    const fieldErrors = candidate.errors || candidate.response?.data?.errors;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      return Object.values(fieldErrors).join(" ");
    }
    return candidate.message || candidate.response?.data?.message || fallback;
  }
  return fallback;
}

function formatMoney(value = 0, currency = "VND") {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCategory(value?: string) {
  return (value || "Listing")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "To be confirmed";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDuration(item?: CartItem) {
  if (!item?.startDate || !item?.endDate || item.endDate <= item.startDate)
    return 1;
  const start = new Date(`${item.startDate}T00:00:00`);
  const end = new Date(`${item.endDate}T00:00:00`);
  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000),
  );
}

function getQuantityLabel(item?: CartItem) {
  switch (item?.listingCategory) {
    case "HOTEL":
      return "Guests";
    case "RESTAURANT":
      return "Guests";
    case "VEHICLE":
      return "Vehicles";
    case "EXPERIENCE":
      return "Participants";
    case "TOUR":
    default:
      return "Travelers";
  }
}

function getDateLabels(item?: CartItem) {
  switch (item?.listingCategory) {
    case "HOTEL":
      return ["Check-in", "Check-out"];
    case "VEHICLE":
      return ["Pickup", "Return"];
    case "RESTAURANT":
      return ["Reservation date", "Time"];
    case "EXPERIENCE":
      return ["Experience date", "Duration"];
    case "TOUR":
    default:
      return ["Travel date", "Duration"];
  }
}

function Stepper({ current }: { current: CheckoutStep }) {
  const activeIndex =
    current === "processing"
      ? 2
      : Math.max(
          0,
          CHECKOUT_STEPS.findIndex((step) => step.key === current),
        );
  const progressWidth = `${Math.min(activeIndex, 3) * 25}%`;

  return (
    <div className="mb-4 w-full overflow-hidden px-0 sm:mb-6 sm:px-3">
      <div className="relative grid min-w-0 grid-cols-4 gap-1.5 sm:gap-4">
        <div className="absolute left-[12.5%] right-[12.5%] top-3.5 h-px bg-slate-200 sm:top-4" />
        <motion.div
          className="absolute left-[12.5%] top-3.5 h-px origin-left bg-gradient-to-r from-blue-600 to-cyan-400 sm:top-4"
          initial={false}
          animate={{ width: progressWidth }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
        {CHECKOUT_STEPS.map((step, index) => {
          const active = index === activeIndex;
          const done = index < activeIndex;
          return (
            <motion.div
              key={step.key}
              className="relative flex min-w-0 flex-col items-center text-center"
              layout
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.div
                className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black sm:h-8 sm:w-8 sm:text-xs ${
                  done || active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                }`}
                animate={{
                  scale: active ? [0.95, 1.06, 1] : 1,
                  boxShadow: active
                    ? "0 12px 28px rgba(37, 99, 235, 0.28)"
                    : done
                      ? "0 8px 18px rgba(37, 99, 235, 0.16)"
                      : "0 0 0 rgba(0, 0, 0, 0)",
                }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {done ? (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="number"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                    >
                      {index + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div className="mt-2 min-w-0 sm:mt-3" layout="position">
                <p
                  className={`truncate text-[11px] font-bold leading-4 sm:text-sm sm:leading-5 ${active ? "text-blue-700" : done ? "text-slate-950" : "text-slate-500"}`}
                >
                  {step.title}
                </p>
                <p className="mt-1 hidden text-[11px] leading-4 text-slate-500 sm:block">
                  {step.subtitle}
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const checkoutContentVariants = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
};

const resultContentVariants = {
  initial: { opacity: 0, y: 28, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.98 },
};

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`rounded-2xl border-blue-100 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-100/60 ${className}`}
    >
      <CardContent className="p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-black leading-6 text-slate-950">
              {title}
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

type PaymentCardMeta = {
  title: string;
  description: string;
  status: "Available" | "Coming Soon";
};

function getPaymentMeta(method: PaymentMethodOption): PaymentCardMeta {
  switch (method.value) {
    case PaymentMethod.MOCK:
      return {
        title: "Visa / Mastercard",
        description: "Pay securely using international cards",
        status: "Available",
      };
    case PaymentMethod.VNPAY:
      return {
        title: "VNPay",
        description: "Vietnam QR & bank transfer",
        status: "Coming Soon",
      };
    case PaymentMethod.MOMO:
      return {
        title: "MoMo",
        description: "Vietnam mobile wallet",
        status: "Available",
      };
    case PaymentMethod.PAYPAL:
      return {
        title: "PayPal",
        description: "International wallet",
        status: "Coming Soon",
      };
    case PaymentMethod.AI_COINS:
      return {
        title: "AI Coins",
        description: "Pay with your coins",
        status: "Available",
      };
    case PaymentMethod.STRIPE:
    default:
      return {
        title: "ZaloPay",
        description: "Vietnam mobile wallet",
        status: "Coming Soon",
      };
  }
}

function PaymentLogoMark({ logo }: { logo: string }) {
  if (logo === "AI_COINS") {
    return (
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-50 shadow-sm ring-1 ring-amber-300/70">
        <img
          src={coinGoldImage}
          alt=""
          aria-hidden="true"
          className="h-10 w-10 object-contain"
        />
      </span>
    );
  }

  if (logo === "CARD") {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-xl font-black italic tracking-tight text-blue-700">
          VISA
        </span>
        <span className="relative h-7 w-10">
          <span className="absolute left-0 top-1 h-6 w-6 rounded-full bg-red-500" />
          <span className="absolute right-0 top-1 h-6 w-6 rounded-full bg-amber-400 mix-blend-multiply" />
        </span>
      </div>
    );
  }

  if (logo === "VNPAY") {
    return (
      <span className="inline-flex items-center gap-1 text-base font-black">
        <span className="inline-block h-5 w-5 rotate-45 rounded bg-red-500" />
        <span className="text-blue-700">VNPAY</span>
      </span>
    );
  }

  if (logo === "MOMO")
    return (
      <span className="rounded-lg bg-pink-600 px-2.5 py-1.5 text-lg font-black text-white">
        mo
        <br className="hidden" />
        mo
      </span>
    );
  if (logo === "ZALOPAY")
    return (
      <span className="rounded-lg bg-blue-500 px-2 py-1 text-sm font-black text-white">
        <span className="text-emerald-300">Zalo</span>
        <br />
        Pay
      </span>
    );
  if (logo === "PAYPAL")
    return (
      <span className="text-xl font-black tracking-tight">
        <span className="text-blue-800">P</span>
        <span className="text-sky-500">Pay</span>
      </span>
    );
  if (logo === "STRIPE")
    return (
      <span className="text-2xl font-black tracking-tight text-violet-600">
        stripe
      </span>
    );
  if (logo === "BANK") return <span className="text-4xl text-blue-600">?</span>;
  if (logo === "APPLE")
    return <span className="text-2xl font-black text-slate-950">?Pay</span>;
  if (logo === "GOOGLE")
    return (
      <span className="text-2xl font-black">
        <span className="text-blue-600">G</span>
        <span className="text-slate-600"> Pay</span>
      </span>
    );
  if (logo === "UNIONPAY")
    return (
      <span className="rounded bg-red-600 px-2 py-1 text-xs font-black text-white">
        UnionPay
      </span>
    );
  if (logo === "JCB")
    return (
      <span className="overflow-hidden rounded text-sm font-black text-white">
        <span className="bg-blue-600 px-1.5 py-1">J</span>
        <span className="bg-red-600 px-1.5 py-1">C</span>
        <span className="bg-emerald-600 px-1.5 py-1">B</span>
      </span>
    );
  if (logo === "ALIPAY")
    return (
      <span className="rounded-lg bg-blue-500 px-2 py-1 text-xl font-black text-white">
        ?
      </span>
    );
  if (logo === "PAYOO")
    return <span className="text-lg font-black text-sky-600">Payoo</span>;
  if (logo === "DINERS")
    return <span className="text-xl font-black text-blue-700">?</span>;
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xl font-black text-slate-500">
      ...
    </span>
  );
}

function PaymentMethodCard({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethodOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = getPaymentMeta(method);
  const comingSoon = meta.status === "Coming Soon";
  const isAiCoins = method.value === PaymentMethod.AI_COINS;
  const title = method.value === PaymentMethod.MOCK ? "Card" : meta.title;
  const description =
    method.value === PaymentMethod.MOCK
      ? "Visa, Mastercard and more"
      : meta.description;

  return (
    <motion.button
      type="button"
      onClick={() => !comingSoon && onSelect()}
      title={
        comingSoon ? "This payment method will be available soon." : description
      }
      aria-disabled={comingSoon}
      whileHover={{ y: -3 }}
      whileTap={{ scale: comingSoon ? 1 : 0.98 }}
      className={`relative min-h-[128px] rounded-2xl border bg-white p-3 text-center shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-h-[150px] sm:p-4 ${
        selected
          ? isAiCoins
            ? "border-violet-500 bg-gradient-to-br from-violet-50/80 to-amber-50/70 shadow-xl shadow-violet-100"
            : "border-blue-500 bg-blue-50/70 shadow-xl shadow-blue-100"
          : "border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60"
      } ${comingSoon ? "opacity-90" : ""}`}
    >
      <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white">
        <AnimatePresence initial={false}>
          {selected && (
            <motion.span
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${isAiCoins ? "bg-violet-600" : "bg-blue-600"}`}
            >
              <Check className="h-3.5 w-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <div className="flex h-11 items-center justify-center sm:h-14">
        <PaymentLogoMark logo={method.badge} />
      </div>
      <h3 className="mt-3 text-sm font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-[140px] text-xs leading-5 text-slate-500">
        {description}
      </p>
      <span
        className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${
          comingSoon
            ? "bg-blue-50 text-blue-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {comingSoon && <Clock className="h-3 w-3" />}
        {comingSoon ? "Coming Soon" : method.featuredLabel || "Recommended"}
      </span>
    </motion.button>
  );
}

function ExtraPaymentOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: (typeof EXTRA_PAYMENT_OPTIONS)[number];
  selected?: boolean;
  onSelect?: () => void;
}) {
  const isBankTransfer = option.id === "BANK";

  return (
    <motion.button
      type="button"
      title={isBankTransfer ? undefined : "This payment method will be available soon."}
      aria-disabled={!isBankTransfer}
      whileHover={{ y: -3 }}
      whileTap={{ scale: isBankTransfer ? 0.98 : 1 }}
      onClick={isBankTransfer ? onSelect : undefined}
      className={cn(
        "relative min-h-[104px] rounded-2xl border p-3 text-center shadow-sm transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-h-[116px] sm:p-4",
        selected
          ? "border-blue-500 bg-blue-50/70 shadow-xl shadow-blue-100"
          : "border-slate-200 bg-white",
        !isBankTransfer && "opacity-90",
      )}
    >
      <span
        className={cn(
          "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border bg-white",
          selected ? "border-blue-500 bg-blue-600 text-white" : "border-slate-300",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
      <div className="flex h-10 items-center justify-center">
        <PaymentLogoMark logo={option.logo} />
      </div>
      <h3 className="mt-3 text-sm font-black text-slate-950">{option.title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {option.description}
      </p>
    </motion.button>
  );
}
function PaymentTrustPanel() {
  const signals = [
    ["PCI DSS", BadgeCheck],
    ["256-bit SSL", Lock],
    ["Fraud Protection", ShieldCheck],
    ["Instant confirmation", CheckCircle2],
  ] as const;

  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 p-4">
      <p className="text-sm font-black text-slate-950">
        Accepted by trusted providers
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {signals.map(([label, Icon]) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
          >
            <Icon className="h-4 w-4 text-blue-600" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckoutHeader({ cartCount }: { cartCount: number }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const displayName = user?.fullName || user?.email || "Traveler";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AI";

  const goTo = (path: string) => {
    setMobileOpen(false);
    setAccountOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
        <div className="grid h-14 grid-cols-[minmax(0,auto)_1fr_auto] items-center gap-2 sm:h-16 sm:gap-3">
          <button
            type="button"
            onClick={() => goTo("/")}
            className="group flex min-w-0 items-center rounded-full pr-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Go to AI Travel Marketplace homepage"
          >
            <img
              src="/brand/ai-marketplace-traveler-logo.png"
              alt="AI Marketplace Traveler"
              className="h-8 w-auto max-w-[128px] object-contain transition-transform duration-300 group-hover:scale-[1.02] sm:h-10 sm:max-w-[178px]"
            />
          </button>

          <nav
            className="hidden justify-center lg:flex"
            aria-label="Checkout navigation"
          >
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
              {CHECKOUT_NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => goTo(item.to)}
                  className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    item.label === "AI Planner"
                      ? "text-blue-700 hover:bg-blue-50"
                      : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                  }`}
                >
                  {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                  {item.label}
                  {item.label === "AI Planner" && (
                    <span className="ml-2 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-blue-700">
                      AI
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:inline-flex"
              aria-label="Language selector"
            >
              <Globe2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo("/wishlist")}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo("/checkout")}
              className="relative h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-10 sm:w-10"
              aria-label="Cart"
            >
              <ShoppingCart className="mx-auto h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white shadow-sm sm:h-5 sm:min-w-5 sm:text-[10px]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-black text-white">
                    {initials}
                  </span>
                  <span className="max-w-28 truncate">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {accountOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setAccountOpen(false)}
                      aria-label="Close account menu"
                    />
                    <div className="absolute right-0 z-40 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                      <div className="border-b border-slate-100 px-3 py-2">
                        <p className="truncate text-sm font-black text-slate-950">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goTo("/profile")}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  variant="outline"
                  className="h-10 rounded-full border-slate-200 bg-white px-4 font-bold shadow-sm hover:-translate-y-0.5"
                  onClick={() => goTo("/login")}
                >
                  Login
                </Button>
                <Button
                  className="h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 font-bold shadow-lg shadow-blue-500/20 hover:-translate-y-0.5"
                  onClick={() => goTo("/register")}
                >
                  Sign Up
                </Button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-10 sm:w-10 lg:hidden"
              aria-label="Toggle checkout navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            className="border-t border-slate-100 py-3 lg:hidden"
            aria-label="Mobile checkout navigation"
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5">
              {CHECKOUT_NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => goTo(item.to)}
                  className="flex min-h-11 w-full items-center rounded-2xl px-3 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.label}
                </button>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 sm:hidden">
                {isAuthenticated ? (
                  <Button
                    className="col-span-2 rounded-2xl"
                    onClick={() => goTo("/profile")}
                  >
                    Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => goTo("/login")}
                    >
                      Login
                    </Button>
                    <Button
                      className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500"
                      onClick={() => goTo("/register")}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

function AiCoinValue({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center justify-end gap-1.5 font-semibold text-slate-950 ${className}`}>
      {value.toLocaleString("en-US")}
      <img src={coinGoldImage} alt="AI Coins" className="h-4 w-4 shrink-0 object-contain" />
    </span>
  );
}

function AiCoinSummary({
  breakdown,
  balance,
  insufficientBalance,
  onTopUp,
  onContinue,
  showActions,
}: {
  breakdown: AiCoinBreakdown;
  balance: number;
  insufficientBalance: boolean;
  onTopUp: () => void;
  onContinue: () => void;
  showActions: boolean;
}) {
  const lines = [
    ["Listing price", breakdown.subtotal],
    ...(breakdown.extrasAmount > 0
      ? ([["Extras & services", breakdown.extrasAmount]] as Array<[string, number]>)
      : []),
    ["Service fee", breakdown.serviceFee],
    ["Taxes & fees", breakdown.tax],
  ] as Array<[string, number]>;

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-50/80 via-white to-amber-50/60 p-4 shadow-sm shadow-violet-100/70">
        <div className="flex items-end justify-between gap-3 border-b border-violet-100 pb-3">
          <div>
            <p className="text-sm font-black text-violet-800">Total (AI Coins)</p>
            <p className="mt-1 text-xs text-slate-500">Includes taxes and platform fees</p>
          </div>
          <AiCoinValue value={breakdown.finalTotal} className="text-2xl font-black text-violet-700" />
        </div>
        <div className="mt-3 space-y-2.5 text-xs">
          {lines.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 text-slate-600">
              <span>{label}</span>
              <AiCoinValue value={value} />
            </div>
          ))}
          {breakdown.discount > 0 && (
            <div className="flex items-center justify-between gap-4 text-emerald-700">
              <span>Discount</span>
              <span>-<AiCoinValue value={breakdown.discount} className="text-emerald-700" /></span>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-2xl border p-3.5 ${insufficientBalance ? "border-rose-200 bg-rose-50/70" : "border-amber-300 bg-amber-50/70"}`}>
        <div className="flex items-center gap-3">
          <img src={coinGoldImage} alt="" aria-hidden="true" className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-950">You&apos;ll pay with AI Coins</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Balance available: <strong>{balance.toLocaleString("en-US")}</strong>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 shrink-0 rounded-xl border-violet-300 bg-white px-3 text-violet-700 hover:bg-violet-50"
            onClick={onTopUp}
          >
            Top up
          </Button>
        </div>
        {insufficientBalance && (
          <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-rose-700">
            You need {(breakdown.finalTotal - balance).toLocaleString("en-US")} more AI Coins.
          </p>
        )}
        <p className="mt-2 flex items-center gap-2 rounded-xl bg-violet-100/70 px-3 py-2 text-xs font-semibold text-violet-700">
          <Sparkles className="h-4 w-4" /> AI Coins offer a simple cashless payment option.
        </p>
      </div>

      {showActions && (
        <MotionButton
          type="button"
          disabled={insufficientBalance}
          onClick={onContinue}
          whileHover={insufficientBalance ? undefined : { y: -1 }}
          whileTap={insufficientBalance ? undefined : { scale: 0.98 }}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 font-black shadow-lg shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <img src={coinGoldImage} alt="" aria-hidden="true" className="mr-2 h-6 w-6 object-contain" />
          Pay with AI Coins
        </MotionButton>
      )}
    </div>
  );
}

function BookingSummaryCard({
  items,
  totals,
  selectedMethod,
  aiCoinBalance,
  onTopUp,
  onCoinContinue,
  showCoinActions,
}: {
  items: CartItem[];
  totals?: PriceBreakdownDto;
  selectedMethod: PaymentMethod;
  aiCoinBalance: number;
  onTopUp: () => void;
  onCoinContinue: () => void;
  showCoinActions: boolean;
}) {
  const primaryItem = items[0];
  const currency = primaryItem?.currency || "VND";
  const labels = getDateLabels(primaryItem);
  const duration = getDuration(primaryItem);
  const total =
    totals?.finalTotal ??
    (primaryItem ? primaryItem.basePrice * primaryItem.quantity * duration : 0);
  const isAiCoinMode = selectedMethod === PaymentMethod.AI_COINS;
  const aiCoinBreakdown = getAiCoinBreakdown(totals, total);
  const insufficientAiCoinBalance = aiCoinBreakdown.finalTotal > aiCoinBalance;
  const destination =
    primaryItem &&
    ([primaryItem.listingCity, primaryItem.listingCountry]
      .filter(Boolean)
      .join(", ") ||
      "Destination confirmed after booking");
  const quantityLabel = getQuantityLabel(primaryItem);

  const paymentBadges = [
    {
      label: "Visa",
      mark: (
        <span className="text-sm font-black italic text-blue-700">VISA</span>
      ),
    },
    {
      label: "Mastercard",
      mark: (
        <span className="relative h-5 w-8">
          <span className="absolute left-0 top-0 h-5 w-5 rounded-full bg-red-500" />
          <span className="absolute right-0 top-0 h-5 w-5 rounded-full bg-amber-400 mix-blend-multiply" />
        </span>
      ),
    },
    {
      label: "JCB",
      mark: (
        <span className="overflow-hidden rounded text-[10px] font-black text-white">
          <span className="bg-blue-600 px-1 py-0.5">J</span>
          <span className="bg-red-600 px-1 py-0.5">C</span>
          <span className="bg-emerald-600 px-1 py-0.5">B</span>
        </span>
      ),
    },
    {
      label: "American Express",
      mark: (
        <span className="text-[9px] font-black leading-none text-blue-600">
          AMERICAN
          <br />
          EXPRESS
        </span>
      ),
    },
    {
      label: "Discover",
      mark: (
        <span className="text-[10px] font-black text-slate-900">
          DISC<span className="text-orange-500">OVER</span>
        </span>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/70 motion-fade-up">
      <CardContent className="p-4 sm:p-5">
        <h2 className="text-lg font-black tracking-tight text-slate-950">
          Your booking summary
        </h2>

        {!primaryItem ? (
          <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center text-sm text-slate-500">
            Your booking summary will appear here.
          </div>
        ) : (
          <>
            <div className="mt-4 flex gap-3">
              <div className="h-[92px] w-[112px] shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                {primaryItem.listingCoverImageUrl ? (
                  <img
                    src={primaryItem.listingCoverImageUrl}
                    alt={primaryItem.listingTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-blue-500">
                    <Sparkles className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                  {formatCategory(primaryItem.listingCategory)}
                </p>
                <h3 className="mt-2 line-clamp-2 text-base font-black leading-5 text-slate-950">
                  {primaryItem.listingTitle}
                </h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-black text-slate-950">
                    {(primaryItem.averageRating || 0).toFixed(1)}
                  </span>
                  <span>({primaryItem.reviewCount || 0} reviews)</span>
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  {destination}
                </p>
              </div>
            </div>

            <div className="my-4 border-t border-slate-100" />

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden border-y border-slate-100 text-sm">
              <div className="flex min-h-[104px] flex-col justify-center px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  {labels[0]}
                </p>

                <div className="ml-6">
                  <p className="mt-1.5 font-black text-slate-950">
                    {formatDate(primaryItem.startDate)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {primaryItem.timeSlot
                      ? `From ${primaryItem.timeSlot}`
                      : "From 2:00 PM"}
                  </p>
                </div>
              </div>

              <div className="flex min-h-[104px] flex-col justify-center px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  {labels[1]}
                </p>

                <div className="ml-6">
                  <p className="mt-1.5 font-black text-slate-950">
                    {primaryItem.endDate
                      ? formatDate(primaryItem.endDate)
                      : primaryItem.timeSlot ||
                        `${duration} ${duration === 1 ? "day" : "days"}`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {primaryItem.endDate
                      ? "Until 12:00 PM"
                      : "Confirmed at checkout"}
                  </p>
                </div>
              </div>

              <div className="flex min-h-[104px] flex-col justify-center px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Users className="h-4 w-4 text-blue-600" />
                  {quantityLabel}
                </p>

                <div className="ml-6">
                  <p className="mt-1.5 font-black text-slate-950">
                    {primaryItem.quantity} {quantityLabel.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex min-h-[104px] flex-col justify-center px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Services
                </p>

                <div className="ml-6">
                  <p className="mt-1.5 font-black text-slate-950">
                    {items.length} {items.length === 1 ? "service" : "services"}
                  </p>
                </div>
              </div>
            </div>

            {isAiCoinMode ? (
              <AiCoinSummary
                breakdown={aiCoinBreakdown}
                balance={aiCoinBalance}
                insufficientBalance={insufficientAiCoinBalance}
                onTopUp={onTopUp}
                onContinue={onCoinContinue}
                showActions={showCoinActions}
              />
            ) : (
              <>
                <div className="flex items-end justify-between gap-4 border-b border-slate-100 py-4">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Total ({currency})
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Includes taxes and platform fees
                    </p>
                  </div>
                  <motion.p
                    key={`${currency}-${total}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="shrink-0 text-right text-2xl font-black tracking-tight text-slate-950"
                  >
                    {formatMoney(total, currency)}
                  </motion.p>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50/50 p-3.5">
                  {[
                    [
                      "Best Price Guarantee",
                      "If you find a lower price, we'll match it.",
                    ],
                    [
                      "Free Cancellation",
                      primaryItem.endDate
                        ? `Cancel for free before ${formatDate(primaryItem.startDate)}`
                        : "Flexible options shown at checkout.",
                    ],
                    [
                      "Instant Confirmation",
                      "You'll receive confirmation instantly.",
                    ],
                  ].map(([title, description]) => (
                    <div key={title} className="flex gap-3 py-1.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-xs font-black text-emerald-800">
                          {title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-4 text-emerald-700">
                          {description}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-5">
              <p className="text-xs font-black text-slate-700">We accept</p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {paymentBadges.map((badge) => (
                  <span
                    key={badge.label}
                    title={badge.label}
                    aria-label={badge.label}
                    className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm"
                  >
                    {badge.mark}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs font-medium leading-5 text-slate-500">
              <Lock className="h-4 w-4 text-slate-500" />
              Your payment is protected with 256-bit SSL encryption.
            </p>
            {primaryItem.providerName && (
              <p className="mt-2 flex items-center gap-2 text-xs font-medium leading-5 text-slate-500">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                By {primaryItem.providerName}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const aiCoinWalletQuery = useAiCoinWallet();
  const [step, setStep] = useState<CheckoutStep>("details");
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    PaymentMethod.MOCK,
  );
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactName, setContactName] = useState(user?.fullName || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber || "");
  const [travelersSameAsContact, setTravelersSameAsContact] = useState(true);
  const checkoutContentRef = useRef<HTMLDivElement>(null);
  const paymentSubmissionRef = useRef(false);
  const sepayReturnHandledRef = useRef(false);
  const [promoCode, setPromoCode] = useState("");

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.getCart();
      setCart(response.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load cart."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (sepayReturnHandledRef.current) return;

    const params = new URLSearchParams(location.search);
    const sepayResult = params.get("sepayResult");
    if (!sepayResult) return;

    sepayReturnHandledRef.current = true;
    const paymentIdFromUrl = Number(params.get("paymentId"));
    let savedSession: ListingBankTransferPaymentSession | null = null;
    const savedSessionValue = window.sessionStorage.getItem(
      "listing-bank-transfer-payment-session",
    );
    if (savedSessionValue) {
      try {
        savedSession = JSON.parse(savedSessionValue) as ListingBankTransferPaymentSession;
      } catch {
        savedSession = null;
      }
    }

    const paymentId =
      Number.isFinite(paymentIdFromUrl) && paymentIdFromUrl > 0
        ? paymentIdFromUrl
        : savedSession?.paymentId;

    setSelectedMethod(PaymentMethod.BANK_TRANSFER);
    setError(null);

    if (sepayResult === "cancel" || sepayResult === "error") {
      setError(
        sepayResult === "cancel"
          ? "Bank Transfer checkout was cancelled. Your booking details are still here."
          : "Bank Transfer checkout could not be completed. Please try again.",
      );
      moveToStep("payment");
      return;
    }

    if (!paymentId) {
      setError("Unable to restore the Bank Transfer payment. Please check Payment History.");
      moveToStep("payment");
      return;
    }

    let cancelled = false;
    const terminalStatuses = new Set<PaymentStatus>([
      PaymentStatus.SUCCESS,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
      PaymentStatus.EXPIRED,
      PaymentStatus.REFUNDED,
    ]);

    const restorePayment = async () => {
      setProcessing(true);
      moveToStep("processing");
      for (let attempt = 0; attempt < 12 && !cancelled; attempt += 1) {
        try {
          const response = await paymentService.getPayment(paymentId);
          const restoredPayment = response.data;
          setPayment(restoredPayment);
          saveRecentPaymentId(restoredPayment.id);
          if (terminalStatuses.has(restoredPayment.status)) {
            moveToStep("result");
            return;
          }
        } catch (err: unknown) {
          if (!cancelled) {
            setError(getApiErrorMessage(err, "Unable to verify Bank Transfer payment."));
            moveToStep("payment");
          }
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }

      if (!cancelled) {
        setError("Bank Transfer payment is still being verified. Please refresh shortly or check Payment History.");
        moveToStep("processing");
      }
    };

    restorePayment().finally(() => {
      if (!cancelled) {
        setProcessing(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [location.search]);

  useEffect(() => {
    if (user) {
      setContactName((current) => current || user.fullName || "");
      setContactEmail((current) => current || user.email || "");
      setContactPhone((current) => current || user.phoneNumber || "");
    }
  }, [user]);

  const validateDetails = () => {
    if (!contactName.trim()) return "Full name is required.";
    if (!contactEmail.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()))
      return "Enter a valid email address.";
    if (!contactPhone.trim()) return "Phone number is required.";
    return null;
  };

  const scrollToCheckoutContent = () => {
    const el = checkoutContentRef.current;
    if (!el) return;

    const headerOffset = 90;
    const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      top: Math.max(0, y),
      behavior: "smooth",
    });
  };

  const moveToStep = (nextStep: CheckoutStep) => {
    setStep(nextStep);
    requestAnimationFrame(() => {
      window.setTimeout(scrollToCheckoutContent, 0);
    });
  };

  const continueToPayment = () => {
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    moveToStep("payment");
  };

  const submitPayment = async (outcome: DevOutcome = "success") => {
    if (!cart || cart.items.length === 0 || paymentSubmissionRef.current) return;

    if (selectedMethod === PaymentMethod.AI_COINS) {
      const fallbackTotal =
        cart.totalBreakdown?.finalTotal ??
        cart.items.reduce(
          (sum, item) => sum + item.basePrice * item.quantity * getDuration(item),
          0,
        );
      const coinTotal = getAiCoinBreakdown(cart.totalBreakdown, fallbackTotal).finalTotal;
      const availableAiCoins = aiCoinWalletQuery.data?.balance ?? 0;
      setError(
        coinTotal > availableAiCoins
          ? `You need ${(coinTotal - availableAiCoins).toLocaleString("en-US")} more AI Coins to complete this booking.`
          : "AI Coins checkout is not connected to the payment service yet. Your balance was not changed.",
      );
      moveToStep("payment");
      return;
    }

    paymentSubmissionRef.current = true;
    setProcessing(true);
    setError(null);
    moveToStep("processing");
    let externalRedirectStarted = false;

    try {
      const orderResponse = await bookingService.createOrder(
        cart.items.map((item) => item.id),
      );
      const scenarioSuffix = outcome === "success" ? "success" : outcome;
      const momoStorageKey = `momo-idempotency-${orderResponse.data.id}`;
      const sepayStorageKey = `sepay-idempotency-${orderResponse.data.id}`;
      const existingMomoKey = window.sessionStorage.getItem(momoStorageKey);
      const existingSepayKey = window.sessionStorage.getItem(sepayStorageKey);
      const idempotencyKey =
        selectedMethod === PaymentMethod.MOMO
          ? existingMomoKey ??
            `checkout-momo-${orderResponse.data.id}-${window.crypto.randomUUID()}`
          : selectedMethod === PaymentMethod.BANK_TRANSFER
            ? existingSepayKey ??
              `checkout-sepay-${orderResponse.data.id}-${window.crypto.randomUUID()}`
          : `checkout-${orderResponse.data.id}-${scenarioSuffix}-${Date.now()}`;
      if (selectedMethod === PaymentMethod.MOMO && !existingMomoKey) {
        window.sessionStorage.setItem(momoStorageKey, idempotencyKey);
      }
      if (selectedMethod === PaymentMethod.BANK_TRANSFER && !existingSepayKey) {
        window.sessionStorage.setItem(sepayStorageKey, idempotencyKey);
      }
      const paymentResponse = await paymentService.createPayment(
        orderResponse.data.id,
        selectedMethod,
        idempotencyKey,
      );
      setPayment(paymentResponse.data);
      saveRecentPaymentId(paymentResponse.data.id);
      if (selectedMethod === PaymentMethod.MOMO) {
        const payUrl = paymentResponse.data.payUrl;
        if (!payUrl) {
          throw new Error(
            "MoMo is still confirming the payment request. Please try again shortly.",
          );
        }
        const parsedPayUrl = new URL(payUrl);
        if (
          parsedPayUrl.protocol !== "https:" ||
          parsedPayUrl.hostname !== "test-payment.momo.vn"
        ) {
          throw new Error("The MoMo payment URL could not be verified.");
        }
        window.location.assign(parsedPayUrl.toString());
        externalRedirectStarted = true;
        return;
      }
      if (selectedMethod === PaymentMethod.BANK_TRANSFER) {
        const { checkoutUrl, checkoutFields } = paymentResponse.data;
        if (!checkoutUrl || !checkoutFields || Object.keys(checkoutFields).length === 0) {
          throw new Error(
            "Bank Transfer checkout is missing signed payment fields. Please try again shortly.",
          );
        }
        const parsedCheckoutUrl = new URL(checkoutUrl);
        if (
          parsedCheckoutUrl.protocol !== "https:" ||
          !["pay-sandbox.sepay.vn", "pay.sepay.vn"].includes(parsedCheckoutUrl.hostname)
        ) {
          throw new Error("The Bank Transfer checkout URL could not be verified.");
        }
        window.sessionStorage.setItem(
          "listing-bank-transfer-payment-session",
          JSON.stringify({
            orderId: orderResponse.data.id,
            paymentId: paymentResponse.data.id,
            listingId: primaryItem?.listingId ?? null,
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            provider: "SEPAY",
            flowType: "LISTING_BOOKING",
            checkoutStep: step,
            originRoute: `${window.location.pathname}${window.location.search}${window.location.hash}`,
          }),
        );
        submitSePayCheckout({
          checkoutUrl: parsedCheckoutUrl.toString(),
          checkoutFields,
        });
        externalRedirectStarted = true;
        return;
      }
      moveToStep("result");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Checkout failed."));
      moveToStep("review");
    } finally {
      if (!externalRedirectStarted) {
        setProcessing(false);
        paymentSubmissionRef.current = false;
      }
    }
  };

  const totals = cart?.totalBreakdown;
  const items = cart?.items ?? [];
  const primaryItem = items[0];
  const currency = primaryItem?.currency || "VND";
  const aiCoinBalance = aiCoinWalletQuery.data?.balance ?? 0;
  const fallbackTotal =
    totals?.finalTotal ??
    items.reduce(
      (sum, item) => sum + item.basePrice * item.quantity * getDuration(item),
      0,
    );
  const aiCoinBreakdown = getAiCoinBreakdown(totals, fallbackTotal);
  const insufficientAiCoinBalance = aiCoinBreakdown.finalTotal > aiCoinBalance;
  const paymentStatus = payment?.status ?? PaymentStatus.PENDING;

  const totalGuests = useMemo(() => primaryItem?.quantity || 0, [primaryItem]);
  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [items],
  );
  const visibleTravelerCount = Math.max(1, Math.min(totalGuests || 1, 2));

  const selectedPaymentLabel =
    selectedMethod === PaymentMethod.BANK_TRANSFER
      ? "Bank Transfer"
      : PAYMENT_METHODS.find((method) => method.value === selectedMethod)?.label ||
        "Mock Payment";
  const isAiCoinSelected = selectedMethod === PaymentMethod.AI_COINS;
  const isMomoSelected = selectedMethod === PaymentMethod.MOMO;
  const isBankTransferSelected = selectedMethod === PaymentMethod.BANK_TRANSFER;

  const wizardContent = (
    <AnimatePresence mode="wait">
      <motion.section
        key={step}
        variants={checkoutContentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={step === "review" ? "space-y-2.5 md:space-y-3" : "space-y-5 md:space-y-6"}
      >
        {step === "details" && (
          <>
            <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-6">
              <SectionCard
                icon={UserRound}
                title="Contact information"
                subtitle="We'll send your booking confirmation here"
              >
                <div className="grid gap-3.5">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Full name
                    </span>
                    <Input
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                      className="mt-1.5 h-11 rounded-2xl"
                      placeholder="John Doe"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Email address
                      </span>
                      <Input
                        value={contactEmail}
                        onChange={(event) =>
                          setContactEmail(event.target.value)
                        }
                        className="mt-1.5 h-11 rounded-2xl"
                        placeholder="john@example.com"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Phone number
                      </span>
                      <Input
                        value={contactPhone}
                        onChange={(event) =>
                          setContactPhone(event.target.value)
                        }
                        className="mt-1.5 h-11 rounded-2xl"
                        placeholder="+84 90 123 45 67"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl bg-blue-50/70 px-3 py-2 text-xs leading-5 text-blue-700">
                    We use these details for booking confirmation, payment
                    updates, and provider coordination.
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={Users}
                title="Traveler information"
                subtitle="Who will be going on this trip?"
              >
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Number of{" "}
                        {primaryItem
                          ? getQuantityLabel(primaryItem).toLowerCase()
                          : "travelers"}
                      </p>
                      <p className="text-xs text-slate-500">
                        From your booking request
                      </p>
                    </div>

                    <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <button
                        type="button"
                        disabled
                        className="h-10 w-10 text-slate-300"
                        aria-label="Decrease travelers"
                      >
                        -
                      </button>
                      <span className="flex h-10 min-w-11 items-center justify-center px-3 text-sm font-black text-slate-950">
                        {totalGuests || 0}
                      </span>
                      <button
                        type="button"
                        disabled
                        className="h-10 w-10 text-slate-300"
                        aria-label="Increase travelers"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {Array.from({ length: visibleTravelerCount }).map(
                    (_, index) => (
                      <label key={index} className="block">
                        <span className="text-xs font-semibold text-slate-600">
                          Traveler {index + 1}
                        </span>
                        <Input
                          value={index === 0 ? contactName : ""}
                          readOnly
                          className="mt-1 h-10 rounded-2xl bg-white"
                          placeholder={
                            index === 0 ? "Contact name" : "Full name"
                          }
                        />
                      </label>
                    ),
                  )}
                </div>

                <label className="mt-3 flex items-center gap-3 text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={travelersSameAsContact}
                    onChange={(event) =>
                      setTravelersSameAsContact(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  The travelers above are also the contact person
                </label>
              </SectionCard>
            </div>

            <div className="flex justify-end">
              <MotionButton
                whileHover={{
                  y: -2,
                  boxShadow: "0 16px 30px rgba(37, 99, 235, 0.26)",
                }}
                whileTap={{ scale: 0.98 }}
                className="h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 shadow-lg shadow-blue-500/20 sm:w-auto"
                onClick={continueToPayment}
              >
                Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
              </MotionButton>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <Card className="overflow-hidden rounded-3xl border-blue-100 bg-white/95 shadow-xl shadow-slate-200/70">
              <CardContent className="p-4 sm:p-5 lg:p-7">
                <div className="mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Choose payment method
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    All transactions are secure and encrypted.
                  </p>
                </div>

                <div className="mb-5 flex items-center gap-2 text-sm font-black text-slate-950">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Star className="h-4 w-4 fill-emerald-500" />
                  </span>
                  Recommended
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {PAYMENT_METHODS.map((method) => (
                    <PaymentMethodCard
                      key={method.value}
                      method={method}
                      selected={selectedMethod === method.value}
                      onSelect={() => setSelectedMethod(method.value)}
                    />
                  ))}
                </div>

                <h3 className="mt-8 text-base font-black text-slate-950">
                  More payment options
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {EXTRA_PAYMENT_OPTIONS.map((option) => (
                    <ExtraPaymentOptionCard
                      key={option.id}
                      option={option}
                      selected={
                        option.id === "BANK" &&
                        selectedMethod === PaymentMethod.BANK_TRANSFER
                      }
                      onSelect={() => setSelectedMethod(PaymentMethod.BANK_TRANSFER)}
                    />
                  ))}
                </div>

                <div className="mt-7 rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Tag className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-950">
                        Have a promo code?
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(event) => setPromoCode(event.target.value)}
                          placeholder="Enter promo code"
                          className="h-11 rounded-2xl border-slate-200 bg-white"
                        />
                        <Button
                          variant="secondary"
                          className="h-11 rounded-2xl px-6 font-bold"
                          disabled
                          title="Promo codes are coming soon"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-2xl bg-white px-7 sm:w-auto"
                    onClick={() => moveToStep("details")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
                  </Button>
                  <MotionButton
                    whileHover={{
                      y: -2,
                      boxShadow: "0 16px 30px rgba(37, 99, 235, 0.26)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-10 shadow-lg shadow-blue-500/20 sm:w-auto sm:min-w-[280px]"
                    onClick={() => moveToStep("review")}
                  >
                    Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
                  </MotionButton>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <PaymentTrustPanel />
              <DevControls onSimulate={(outcome) => submitPayment(outcome)} />
            </div>
          </>
        )}
        {step === "review" && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Review your booking
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Please review all details carefully before confirming your booking.
                </p>
              </div>
              <div className="flex w-fit items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                <ShieldCheck className="h-5 w-5" />
                <span>
                  <span className="block font-black">Secure Checkout</span>
                  <span className="text-xs text-emerald-700">
                    Your data is protected and encrypted
                  </span>
                </span>
              </div>
            </div>

            <Card className="rounded-3xl border-blue-100 bg-white/95 shadow-xl shadow-slate-200/70">
              <CardContent className="p-3.5 sm:p-4">
                <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] xl:items-center">
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 sm:h-44 lg:h-32 lg:aspect-auto">
                    {primaryItem?.listingCoverImageUrl ? (
                      <img
                        src={primaryItem.listingCoverImageUrl}
                        alt={primaryItem.listingTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-blue-500">
                        <Sparkles className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_1.8fr] xl:items-center">
                    <div>
                      <p className="w-fit rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        {formatCategory(primaryItem?.listingCategory)}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-xl font-black leading-7 text-slate-950">
                        {primaryItem?.listingTitle || "Selected travel service"}
                      </h3>
                      <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                        <p className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-black text-slate-950">
                            {(primaryItem?.averageRating || 0).toFixed(1)}
                          </span>
                          ({primaryItem?.reviewCount || 0} reviews)
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          {[primaryItem?.listingCity, primaryItem?.listingCountry]
                            .filter(Boolean)
                            .join(", ") || "Destination confirmed after booking"}
                        </p>
                        <p className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          {primaryItem?.providerName || "Verified provider"}
                        </p>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 sm:hidden">
                      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 text-sm">
                        {[
                          ["Check-in", formatDate(primaryItem?.startDate), CalendarDays],
                          ["Check-out", formatDate(primaryItem?.endDate), CalendarDays],
                          [
                            "Duration",
                            `${primaryItem ? getDuration(primaryItem) : 1} ${
                              primaryItem && getDuration(primaryItem) === 1
                                ? "night"
                                : "nights"
                            }`,
                            Clock,
                          ],
                          ["Guests", `${totalGuests || 0} guests`, Users],
                          [
                            "Services",
                            `${items.length} ${items.length === 1 ? "service" : "services"}`,
                            CreditCard,
                          ],
                          [
                            "Type",
                            formatCategory(primaryItem?.listingCategory),
                            BadgeCheck,
                          ],
                        ].map(([label, value, Icon]) => (
                          <div
                            key={label as string}
                            className="flex min-h-[72px] flex-col justify-center p-3"
                          >
                            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                              <Icon className="h-3.5 w-3.5 text-blue-600" />
                              {label as string}
                            </p>
                            <p className="mt-1 text-xs font-black leading-4 text-slate-950">
                              {value as string}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hidden gap-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      {[
                        ["Check-in", formatDate(primaryItem?.startDate), "From 2:00 PM", CalendarDays],
                        ["Check-out", formatDate(primaryItem?.endDate), "Until 12:00 PM", CalendarDays],
                        [
                          "Duration",
                          `${primaryItem ? getDuration(primaryItem) : 1} ${
                            primaryItem && getDuration(primaryItem) === 1
                              ? "night"
                              : "nights"
                          }`,
                          "",
                          Clock,
                        ],
                        ["Guests", `${totalGuests || 0} guests`, "", Users],
                        [
                          "Services",
                          `${items.length} ${items.length === 1 ? "service" : "services"}`,
                          "",
                          CreditCard,
                        ],
                      ].map(([label, value, detail, Icon]) => (
                        <div
                          key={label as string}
                          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 xl:rounded-none xl:border-y-0 xl:border-r-0 xl:bg-transparent xl:p-0 xl:pl-5"
                        >
                          <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Icon className="h-4 w-4 text-blue-600" />
                            {label as string}
                          </p>
                          <p className="mt-1.5 text-sm font-black text-slate-950">
                            {value as string}
                          </p>
                          {detail && (
                            <p className="mt-1 text-xs text-slate-500">
                              {detail as string}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-blue-100 bg-white/95 shadow-lg shadow-slate-200/60">
              <CardContent className="grid gap-3 p-3 sm:p-3.5 lg:grid-cols-[220px_minmax(0,1fr)_300px_auto] lg:items-center">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <p className="font-black text-slate-950">Contact information</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Full name</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{contactName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Email address</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Phone number</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{contactPhone}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
                  <ShieldCheck className="mr-2 inline h-4 w-4" />
                  We'll send your booking confirmation and updates here.
                </div>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-2xl bg-white px-5 sm:w-auto"
                  onClick={() => moveToStep("details")}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-blue-100 bg-white/95 shadow-lg shadow-slate-200/60">
              <CardContent className="grid gap-3 p-3 sm:p-3.5 lg:grid-cols-[220px_minmax(0,1fr)_300px_auto] lg:items-center">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <p className="font-black text-slate-950">Traveler information</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Number of guests</p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {totalGuests || 0} guests
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                    <p className="text-xs font-bold text-slate-500">
                      Traveler 1 (Contact Person)
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">{contactName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>
                    {travelersSameAsContact
                      ? "The travelers above are also the contact person."
                      : "Traveler details are confirmed from the booking request."}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-2xl bg-white px-5 sm:w-auto"
                  onClick={() => moveToStep("details")}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-blue-100 bg-white/95 shadow-lg shadow-slate-200/60">
              <CardContent className="grid gap-3 p-3 sm:p-3.5 lg:grid-cols-[220px_minmax(0,1fr)_300px_auto] lg:items-center">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <p className="font-black text-slate-950">Payment method</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-xl border px-4 py-2 text-sm font-black",
                      isAiCoinSelected
                        ? "border-amber-300 bg-amber-50 text-amber-950"
                        : isMomoSelected
                          ? "border-pink-300 bg-pink-50 text-pink-950"
                          : isBankTransferSelected
                            ? "border-blue-300 bg-blue-50 text-blue-950"
                        : "border-slate-200 bg-white text-slate-950",
                    )}
                  >
                    {isAiCoinSelected && (
                      <img
                        src={coinGoldImage}
                        alt=""
                        aria-hidden="true"
                        className="mr-2 h-5 w-5 object-contain"
                      />
                    )}
                    {isAiCoinSelected
                      ? "AI Coins"
                      : isMomoSelected
                        ? "MoMo"
                        : isBankTransferSelected
                          ? "Bank Transfer"
                        : "Card"}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-950">
                      {selectedPaymentLabel}
                    </span>
                    <span className="text-xs text-slate-500">
                      {isAiCoinSelected
                        ? "Pay with your available AI Coin balance"
                        : isMomoSelected
                          ? "Secure MoMo Sandbox wallet payment"
                          : isBankTransferSelected
                            ? "Secure SePay bank transfer checkout"
                        : "Instant test payment through MockPaymentGateway"}
                    </span>
                  </span>
                </div>
                <div className="w-fit rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">
                  <Lock className="mr-2 inline h-4 w-4" />
                  Secure & Encrypted
                </div>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-2xl bg-white px-5 sm:w-auto"
                  onClick={() => moveToStep("payment")}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-blue-100 bg-white/95 shadow-lg shadow-slate-200/60">
              <CardContent className="grid gap-3 p-3 sm:p-3.5 lg:grid-cols-[220px_minmax(0,1fr)_minmax(240px,300px)] lg:items-center">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Tag className="h-5 w-5" />
                  </span>
                  <p className="font-black text-slate-950">Price breakdown</p>
                </div>
                <div className="w-full max-w-3xl space-y-1.5 text-sm lg:max-w-2xl xl:max-w-3xl">
                  {totals && (
                    <>
                      <div className="flex justify-between gap-4 text-slate-600">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-950">
                          {formatMoney(totals.subtotal, currency)}
                        </span>
                      </div>
                      {(totals.extrasAmount ?? 0) > 0 && (
                        <div className="flex justify-between gap-4 text-slate-600">
                          <span>Extras & services</span>
                          <span className="font-semibold text-slate-950">
                            {formatMoney(totals.extrasAmount ?? 0, currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 text-slate-600">
                        <span>Service fee</span>
                        <span className="font-semibold text-slate-950">
                          {formatMoney(totals.serviceFee, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-600">
                        <span>Taxes & fees</span>
                        <span className="font-semibold text-slate-950">
                          {formatMoney(totals.tax, currency)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-dashed border-slate-200 pt-2.5">
                    <div className="flex items-end justify-between gap-4">
                      <span>
                        <span className="block font-black text-slate-950">
                          Total ({currency})
                        </span>
                        <span className="text-xs text-slate-500">
                          Includes taxes and platform fees
                        </span>
                      </span>
                      <span className="text-2xl font-black tracking-tight text-slate-950">
                        {formatMoney(totals?.finalTotal || 0, currency)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-sm">
                  <p className="flex items-center gap-2 font-black text-blue-900">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Best Price Guarantee
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    If you find a lower price for the same booking, we'll match it.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-blue-100 bg-white/95 shadow-lg shadow-slate-200/60">
              <CardContent className="grid gap-3 p-3 sm:p-3.5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <p className="font-black text-slate-950">
                    Special requests <span className="font-medium text-slate-500">(Optional)</span>
                  </p>
                </div>
                <p className="text-sm text-slate-600">No special requests added.</p>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-2xl bg-white px-5 sm:w-auto"
                  onClick={() => moveToStep("details")}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-blue-100 bg-white/95 shadow-xl shadow-slate-200/70">
              <CardContent className="p-3.5">
                <label className="flex items-start gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    I have read and agree to the{" "}
                    <span className="font-bold text-blue-700">Terms of Service</span>,{" "}
                    <span className="font-bold text-blue-700">Privacy Policy</span> and{" "}
                    <span className="font-bold text-blue-700">Cancellation Policy</span>.
                  </span>
                </label>

                <div className="mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-2xl bg-white px-8 sm:h-14 sm:w-auto"
                    onClick={() => moveToStep("payment")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payment
                  </Button>
                  <MotionButton
                    whileHover={{
                      y: processing || insufficientAiCoinBalance ? 0 : -2,
                      boxShadow: "0 16px 30px rgba(37, 99, 235, 0.26)",
                    }}
                    whileTap={{
                      scale: processing || insufficientAiCoinBalance ? 1 : 0.98,
                    }}
                    className={cn(
                      "h-14 w-full rounded-2xl px-6 shadow-lg sm:w-[360px] sm:px-10 lg:w-[400px]",
                      isAiCoinSelected
                        ? "bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 shadow-violet-500/20"
                        : isMomoSelected
                          ? "bg-gradient-to-r from-pink-600 to-fuchsia-600 shadow-pink-500/20"
                          : isBankTransferSelected
                            ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/20"
                        : "bg-gradient-to-r from-blue-600 to-teal-500 shadow-blue-500/20",
                    )}
                    onClick={() => submitPayment("success")}
                    disabled={
                      processing ||
                      (isAiCoinSelected && insufficientAiCoinBalance)
                    }
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isAiCoinSelected ? (
                      <img
                        src={coinGoldImage}
                        alt=""
                        aria-hidden="true"
                        className="mr-2 h-6 w-6 object-contain"
                      />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    <span>
                      <span className="block font-black">
                        {isAiCoinSelected
                          ? "Pay with AI Coins"
                          : isMomoSelected
                            ? "Pay with MoMo"
                            : isBankTransferSelected
                              ? "Pay by Bank Transfer"
                          : "Confirm Booking"}
                      </span>
                      <span className="block text-xs font-medium text-white/85">
                        {isAiCoinSelected && insufficientAiCoinBalance
                          ? "Top up your balance to continue"
                          : isMomoSelected
                            ? "Continue securely in MoMo Sandbox"
                            : isBankTransferSelected
                              ? "Continue securely in SePay"
                          : "You won't be charged yet"}
                      </span>
                    </span>
                    <ArrowRight className="ml-4 h-4 w-4" />
                  </MotionButton>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === "processing" && (
          <Card className="mx-auto max-w-md rounded-3xl">
            <CardContent className="py-16 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 animate-pulse text-blue-600" />
              <h2 className="text-xl font-bold text-slate-950">
                Processing payment...
              </h2>
              <PaymentTimeline
                currentStatus={PaymentStatus.PROCESSING}
                className="mt-8 text-left"
              />
            </CardContent>
          </Card>
        )}

        {step === "result" && payment && (
          payment.status === PaymentStatus.SUCCESS ? (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
                <div className="space-y-5">
                  <Card className="overflow-hidden rounded-[28px] border-blue-100 bg-white shadow-xl shadow-blue-100/50">
                    <CardContent className="relative min-h-[360px] p-0">
                      <img
                        src={paymentListingSuccessImage}
                        alt="Booking payment completed successfully"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="relative grid min-h-[360px] items-center gap-4 p-5 sm:p-7 lg:grid-cols-[0.48fr_0.52fr] lg:p-8">
                        <div className="min-h-[180px]" aria-hidden="true" />
                        <motion.div
                          variants={resultContentVariants}
                          initial="initial"
                          animate="animate"
                          className="rounded-[24px] border border-white/80 bg-white/82 p-5 shadow-lg shadow-blue-100/70 backdrop-blur-sm sm:p-6"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
                              <CheckCircle2 className="h-8 w-8" />
                            </span>
                            <div>
                              <StatusBadge kind="payment" status={payment.status} />
                              <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-700 sm:text-3xl">
                                Payment Successful!
                              </h2>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                            Thank you, your booking is confirmed. Your reservation and payment details have been updated.
                          </p>

                          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white/90">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-sm">
                              <span className="font-semibold text-slate-600">Order ID</span>
                              <span className="font-black text-slate-950">
                                {payment.orderNumber || `#${payment.orderId || payment.id}`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                              <span className="font-semibold text-slate-600">Total Paid</span>
                              <span className="text-xl font-black tracking-tight text-emerald-700">
                                {formatMoney(payment.amount, payment.currency || currency)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <Button
                              className="h-12 rounded-2xl bg-blue-600 font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700"
                              onClick={() => navigate(`/payments/${payment.id}`)}
                            >
                              <Plane className="mr-2 h-4 w-4" />
                              View payment details
                            </Button>
                            <Button
                              variant="outline"
                              className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
                              disabled
                              title="Invoice download is not available yet"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download invoice
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[26px] border-blue-100 bg-white/95 shadow-lg shadow-blue-100/40">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-4">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm">
                          <ShieldCheck className="h-8 w-8" />
                        </span>
                        <div>
                          <h3 className="text-lg font-black text-slate-950">Payment Progress</h3>
                          <p className="mt-1 text-sm text-slate-500">Verified through the current payment status flow.</p>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        {[
                          { title: "Order Placed", time: payment.createdAt, Icon: Check },
                          { title: "Processing Payment", time: payment.createdAt, Icon: Check },
                          { title: "Payment Complete", time: payment.paidAt || payment.updatedAt, Icon: Sparkles },
                        ].map(({ title, time, Icon }, index) => (
                          <div key={title} className="relative rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-center">
                            {index < 2 && <span className="pointer-events-none absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-emerald-200 sm:block" />}
                            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                              <Icon className="h-5 w-5" />
                            </span>
                            <p className="mt-3 text-sm font-black text-slate-900">{title}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{formatTime(String(time || ""))}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                      className="h-12 rounded-2xl bg-blue-600 px-8 font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700"
                      onClick={() => navigate("/search")}
                    >
                      <Plane className="mr-2 h-4 w-4" />
                      Explore more trips
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 rounded-2xl bg-white px-8 font-bold"
                      onClick={() => navigate("/search")}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Back to listings
                    </Button>
                  </div>
                </div>

                <aside className="space-y-4">
                  <Card className="rounded-[26px] border-blue-100 bg-white/95 shadow-xl shadow-slate-200/70">
                    <CardContent className="p-5">
                      <h3 className="text-lg font-black text-slate-950">Your booking summary</h3>
                      {primaryItem ? (
                        <>
                          <div className="mt-4 flex gap-4">
                            <div className="h-[118px] w-[128px] shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                              {primaryItem.listingCoverImageUrl ? (
                                <img
                                  src={primaryItem.listingCoverImageUrl}
                                  alt={primaryItem.listingTitle}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-blue-500">
                                  <Sparkles className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="line-clamp-2 text-base font-black leading-5 text-slate-950">
                                {primaryItem.listingTitle}
                              </h4>
                              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                {[primaryItem.listingCity, primaryItem.listingCountry].filter(Boolean).join(", ") || "Location confirmed after booking"}
                              </p>
                              <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                                <span className="text-slate-500">Check-in</span>
                                <span className="text-right font-semibold text-slate-950">{formatDate(primaryItem.startDate)}</span>
                                <span className="text-slate-500">Check-out</span>
                                <span className="text-right font-semibold text-slate-950">{formatDate(primaryItem.endDate)}</span>
                                <span className="text-slate-500">Guests</span>
                                <span className="text-right font-semibold text-slate-950">
                                  {primaryItem.quantity} {getQuantityLabel(primaryItem).toLowerCase()}
                                </span>
                                <span className="text-slate-500">Services</span>
                                <span className="text-right font-semibold text-slate-950">
                                  {items.length} {items.length === 1 ? "service" : "services"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(primaryItem.listingSlug ? `/listings/${primaryItem.listingSlug}` : "/search")}
                            className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 transition hover:text-blue-800"
                          >
                            View booking details <ArrowRight className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5 text-center text-sm text-slate-500">
                          Booking details are unavailable.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {(totals?.discount || 0) > 0 && (
                    <Card className="rounded-[24px] border-emerald-100 bg-white/95 shadow-lg shadow-emerald-100/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="flex items-center gap-2 text-base font-black text-slate-950">
                              <Tag className="h-5 w-5 text-blue-600" />
                              Promo code
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              You saved {formatMoney(totals?.discount || 0, currency)} on this booking.
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                            Applied
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm">
                          <span className="font-semibold text-slate-600">{promoCode || "Promo applied"}</span>
                          <span className="font-black text-emerald-700">-{formatMoney(totals?.discount || 0, currency)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </aside>
              </div>

              <Card className="rounded-[26px] border-blue-100 bg-white/95 shadow-lg shadow-slate-200/60">
                <CardContent className="grid gap-4 p-5 md:grid-cols-3 md:divide-x md:divide-slate-200">
                  {[
                    { Icon: ShieldCheck, title: "Secure Payment", description: "Protected by industry-standard security." },
                    { Icon: BadgeCheck, title: "Best Price Guarantee", description: "Transparent pricing from verified providers." },
                    { Icon: Headphones, title: "24/7 Support", description: "Help is available throughout your trip." },
                  ].map(({ Icon, title, description }) => (
                    <div key={title} className="flex items-center gap-4 md:px-5 first:md:pl-0 last:md:pr-0">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span>
                        <span className="block font-black text-slate-950">{title}</span>
                        <span className="mt-1 block text-sm text-slate-500">{description}</span>
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-6">
              <Card className="rounded-3xl">
                <CardContent className="py-12 text-center">
                  {payment.status === PaymentStatus.EXPIRED ? (
                    <Clock className="mx-auto mb-4 h-16 w-16 text-slate-500" />
                  ) : (
                    <XCircle className="mx-auto mb-4 h-16 w-16 text-red-600" />
                  )}
                  <div className="mb-2 flex justify-center">
                    <StatusBadge kind="payment" status={payment.status} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Payment result
                  </h2>
                  <p className="mt-2 text-slate-500">
                    Payment #{payment.id} for order #{payment.orderId}
                  </p>
                  <p className="mt-2 font-bold text-slate-950">
                    {formatMoney(payment.amount, payment.currency || currency)}
                  </p>
                </CardContent>
              </Card>
              <PaymentTimeline
                currentStatus={paymentStatus}
                createdAt={payment.createdAt}
                updatedAt={payment.updatedAt}
              />
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => navigate(`/payments/${payment.id}`)}>
                  View payment
                </Button>
                <Button variant="outline" onClick={() => navigate("/search")}>
                  Browse listings
                </Button>
              </div>
            </div>
          )
        )}
      </motion.section>
    </AnimatePresence>
  );

  return (
    <>
      <CheckoutHeader cartCount={cartCount} />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white">
        <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
          <button
            type="button"
            onClick={() =>
              navigate(
                primaryItem?.listingSlug
                  ? `/listings/${primaryItem.listingSlug}`
                  : "/search",
              )
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back to listing
          </button>

          <div className="mb-4">
            <div>
              <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                Checkout
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-600 sm:mt-2 sm:text-base">
                Complete your travel booking in a few simple steps.
              </p>
            </div>
          </div>

          <Stepper current={step} />

          {error && (
            <StateBlock
              variant="error"
              title="Checkout needs attention"
              description={error}
              className="mb-6 py-6"
            />
          )}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                variants={checkoutContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <StateBlock
                  variant="loading"
                  title="Loading cart"
                  description="Fetching your active backend cart."
                  className="py-16"
                />
              </motion.div>
            ) : items.length === 0 && !payment ? (
              <motion.div
                key="empty"
                variants={checkoutContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <StateBlock
                  title="Your cart is empty"
                  description="Browse listings and add an available travel service before checkout."
                  actionLabel="Explore listings"
                  onAction={() => navigate("/search")}
                  className="py-16"
                />
              </motion.div>
            ) : (
              <motion.div
                key="checkout-shell"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className={
                  step === "review"
                    ? "grid gap-4"
                    : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-5"
                }
              >
                <div ref={checkoutContentRef} className="min-w-0 scroll-mt-24">
                  {wizardContent}
                </div>
                {step !== "review" && (
                  <aside className="order-first space-y-3 lg:order-none lg:sticky lg:top-20 lg:self-start xl:space-y-4">
                    <BookingSummaryCard
                      items={items}
                      totals={totals}
                      selectedMethod={selectedMethod}
                      aiCoinBalance={aiCoinBalance}
                      onTopUp={() => navigate("/ai-coins")}
                      onCoinContinue={() => moveToStep("review")}
                      showCoinActions={step === "payment"}
                    />
                    {step !== "payment" && (
                      <>
                        <Card className="rounded-2xl border-blue-100 bg-white/95 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="flex items-center gap-2 font-black text-slate-950">
                                  <Tag className="h-5 w-5 text-blue-600" /> Promo
                                  code
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  Apply travel credits or partner offers.
                                </p>
                              </div>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Soon
                              </span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Input
                                value={promoCode}
                                onChange={(event) =>
                                  setPromoCode(event.target.value)
                                }
                                placeholder="Enter promo code"
                                className="h-11 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-blue-500"
                              />
                              <Button
                                variant="secondary"
                                className="h-11 rounded-2xl px-5 font-bold transition-transform hover:-translate-y-0.5"
                                disabled
                                title="Promo codes are coming soon"
                              >
                                Apply
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        <p className="px-2 text-xs leading-5 text-slate-500">
                          By proceeding, you agree to our Terms of Service and
                          Privacy Policy.
                        </p>
                      </>
                    )}
                  </aside>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-blue-100 bg-white/80">
          <div className="mx-auto grid max-w-[1440px] gap-3 px-4 py-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {[
              [
                "Secure Payment",
                "Protected by industry-standard security.",
                ShieldCheck,
              ],
              [
                "Best Price Guarantee",
                "Transparent pricing from verified providers.",
                BadgeCheck,
              ],
              [
                "24/7 Support",
                "Help is available throughout your trip.",
                Headphones,
              ],
            ].map(([title, desc, Icon]) => (
              <div
                key={String(title)}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  {React.createElement(Icon as React.ElementType, {
                    className: "h-5 w-5",
                  })}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {title as string}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {desc as string}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};
