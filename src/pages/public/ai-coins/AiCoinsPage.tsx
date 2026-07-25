import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAiCoinsModal } from "@/context/AiCoinsModalContext";
import { useAuthenticationGate } from "@/context/AuthenticationGateContext";
import { cn } from "@/lib/utils";
import { coinGoldImage } from "./coinPackageAssets";
import {
  AiCoinPackage,
  dailyCoinPassPackage,
  largeCoinPackages,
  primaryCoinPackages,
} from "./coinPackageConfig";
import { MembershipCoinTopLayout } from "./MembershipCoinTopLayout";
import {
  cardContainerVariants,
  cardItemVariants,
  UpgradeThemeGlow,
  UpgradeModeTransition,
  useUpgradeModeTransition,
} from "./useUpgradeModeTransition";

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const benefits = [
  {
    title: "Best Value",
    description: "More coins for less",
    icon: Star,
    color: "text-amber-300",
  },
  {
    title: "Instant Delivery",
    description: "Coins added instantly",
    icon: Zap,
    color: "text-blue-300",
  },
  {
    title: "Secure Payment",
    description: "100% safe & trusted",
    icon: ShieldCheck,
    color: "text-cyan-300",
  },
  {
    title: "Use Anywhere",
    description: "Use for all services",
    icon: Sparkles,
    color: "text-violet-300",
  },
];

const paymentMethods = [
  "Visa / Mastercard",
  "MoMo",
  "ZaloPay",
  "Apple Pay / Google Pay",
  "Bank Transfer",
];

type PackageAction = (pkg: AiCoinPackage) => void;

type CoinPackageTheme = {
  background: string;
  border: string;
  glow: string;
  glowSecondary?: string;
  glowCore?: string;
  accent: string;
  bonusBackground: string;
  bonusText: string;
  buttonBackground?: string;
  buttonBorder?: string;
};

const coinPackageThemes: Record<string, CoinPackageTheme> = {
  starter: {
    background: "bg-gradient-to-b from-[#031028] via-[#010D23] to-[#000C21]",
    border: "rgba(139, 92, 246, 0.42)",
    glow: "rgba(124, 58, 237, 0.16)",
    accent: "#c4b5fd",
    bonusBackground: "rgba(16, 185, 129, 0.12)",
    bonusText: "#6ee7b7",
  },
  explorer: {
    background:
      "bg-[radial-gradient(circle_at_50%_42%,rgba(24,65,130,0.25)_0%,rgba(6,18,47,0.12)_45%,transparent_72%),linear-gradient(180deg,#081435_0%,#06122F_55%,#04102D_100%)]",
    border: "rgba(245, 158, 11, 0.38)",
    glow: "rgba(245, 158, 11, 0.15)",
    accent: "#fcd34d",
    bonusBackground: "rgba(16, 185, 129, 0.12)",
    bonusText: "#6ee7b7",
  },
  traveler: {
    background:
      "linear-gradient(180deg, rgba(64, 37, 20, 0.92), rgba(7, 19, 44, 0.99))",
    border: "rgba(217, 119, 6, 0.38)",
    glow: "rgba(217, 119, 6, 0.14)",
    accent: "#fdba74",
    bonusBackground: "rgba(16, 185, 129, 0.12)",
    bonusText: "#6ee7b7",
  },
  adventure: {
    background:
      "linear-gradient(180deg, rgba(72, 42, 16, 0.96), rgba(21, 17, 24, 0.99))",
    border: "rgba(251, 191, 36, 0.85)",
    glow: "rgba(245, 158, 11, 0.30)",
    accent: "#fde68a",
    bonusBackground: "rgba(245, 158, 11, 0.13)",
    bonusText: "#fcd34d",
    buttonBackground: "linear-gradient(135deg, #f59e0b, #f97316)",
    buttonBorder: "rgba(253, 186, 116, 0.8)",
  },
  pro: {
    background:
      "linear-gradient(180deg, rgba(60, 20, 79, 0.95), rgba(11, 16, 44, 0.99))",
    border: "rgba(192, 38, 211, 0.46)",
    glow: "rgba(168, 85, 247, 0.19)",
    accent: "#e879f9",
    bonusBackground: "rgba(217, 70, 239, 0.12)",
    bonusText: "#f0abfc",
  },
  elite: {
    background:
      "linear-gradient(180deg, rgba(73, 23, 57, 0.95), rgba(10, 16, 43, 0.99))",
    border: "rgba(236, 72, 153, 0.44)",
    glow: "rgba(236, 72, 153, 0.17)",
    accent: "#f9a8d4",
    bonusBackground: "rgba(236, 72, 153, 0.12)",
    bonusText: "#f9a8d4",
  },
  mega: {
    background:
      "radial-gradient(circle at 24% 48%, rgba(37,99,235,0.18), transparent 34%), linear-gradient(145deg,#071735 0%,#050D24 56%,#020817 100%)",
    border: "rgba(59, 130, 246, 0.48)",
    glow: "rgba(37, 99, 235, 0.19)",
    glowSecondary: "rgba(168, 85, 247, 0.46)",
    glowCore: "rgba(56, 189, 248, 0.72)",
    accent: "#93c5fd",
    bonusBackground: "rgba(16, 185, 129, 0.12)",
    bonusText: "#6ee7b7",
  },
  ultimate: {
    background:
      "radial-gradient(circle at 24% 48%, rgba(124,58,237,0.18), transparent 35%), linear-gradient(145deg,#111536 0%,#090D25 58%,#030817 100%)",
    border: "rgba(245, 158, 11, 0.46)",
    glow: "rgba(124, 58, 237, 0.16)",
    glowSecondary: "rgba(99, 102, 241, 0.48)",
    glowCore: "rgba(196, 181, 253, 0.76)",
    accent: "#fcd34d",
    bonusBackground: "rgba(16, 185, 129, 0.12)",
    bonusText: "#6ee7b7",
  },
  galaxy: {
    background:
      "radial-gradient(circle at 24% 48%, rgba(168,85,247,0.20), transparent 36%), linear-gradient(145deg,#10143A 0%,#070D29 56%,#020817 100%)",
    border: "rgba(139, 92, 246, 0.52)",
    glow: "rgba(124, 58, 237, 0.22)",
    glowSecondary: "rgba(217, 70, 239, 0.48)",
    glowCore: "rgba(34, 211, 238, 0.76)",
    accent: "#c4b5fd",
    bonusBackground: "rgba(245, 158, 11, 0.11)",
    bonusText: "#fcd34d",
  },
  "daily-pass": {
    background:
      "bg-[radial-gradient(circle_at_32%_42%,rgba(96,49,145,0.32),transparent_48%),linear-gradient(135deg,#1E133C,#10102F_48%,#071029)]",
    border: "rgba(245, 158, 11, 0.52)",
    glow: "rgba(249, 115, 22, 0.18)",
    accent: "#fde68a",
    bonusBackground: "rgba(245, 158, 11, 0.12)",
    bonusText: "#fcd34d",
    buttonBackground: "linear-gradient(135deg, #f59e0b, #ea580c)",
    buttonBorder: "rgba(251, 191, 36, 0.72)",
  },
};

const getPackageTheme = (packageId: string) =>
  coinPackageThemes[packageId] ?? coinPackageThemes.starter;

const getPackageThemeStyle = (theme: CoinPackageTheme) =>
  ({
    "--package-background": theme.background,
    "--package-border": theme.border,
    "--package-glow": theme.glow,
    "--package-glow-secondary": theme.glowSecondary ?? theme.glow,
    "--package-glow-core": theme.glowCore ?? theme.accent,
    "--package-accent": theme.accent,
    "--package-bonus-bg": theme.bonusBackground,
    "--package-bonus-text": theme.bonusText,
    "--package-button-bg":
      theme.buttonBackground ??
      "linear-gradient(135deg, rgba(91, 33, 182, 0.72), rgba(76, 29, 149, 0.58))",
    "--package-button-border": theme.buttonBorder ?? theme.border,
    background: "var(--package-background)",
    borderColor: "var(--package-border)",
    boxShadow:
      "0 16px 38px rgba(2, 6, 23, 0.28), 0 0 24px var(--package-glow), inset 0 1px 0 rgba(255, 255, 255, 0.025)",
  }) as React.CSSProperties;

const cosmicPackageIds = new Set(["mega", "ultimate", "galaxy"]);

const CosmicPackageGlow = ({ packageId }: { packageId: string }) => {
  if (!cosmicPackageIds.has(packageId)) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-[-16%_-10%] -z-10 overflow-hidden rounded-[42%]"
    >
      {/* Quầng sáng mềm bám quanh biểu tượng, không lan sang nội dung card. */}
      <span className="absolute inset-[12%_8%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--package-glow-core)_0%,var(--package-glow-secondary)_28%,transparent_72%)] opacity-45 blur-2xl motion-safe:animate-[pulse_3.8s_ease-in-out_infinite]" />

      {/* Hai vệt quỹ đạo mảnh tạo cảm giác chuyển động vũ trụ. */}
      <span className="absolute left-1/2 top-1/2 h-[54%] w-[108%] -translate-x-1/2 -translate-y-1/2 -rotate-[11deg] rounded-[50%] border border-[var(--package-glow-core)]/60 opacity-55 shadow-[0_0_14px_var(--package-glow-secondary)]" />
      <span className="absolute left-1/2 top-1/2 h-[72%] w-[92%] -translate-x-1/2 -translate-y-1/2 rotate-[-17deg] rounded-[50%] border border-[var(--package-glow-secondary)]/55 opacity-45 blur-[0.4px]" />

      {/* Vệt sáng chéo và các điểm sao nhỏ. */}
      <span className="absolute left-[4%] top-[58%] h-px w-[92%] -rotate-[9deg] bg-[linear-gradient(90deg,transparent,var(--package-glow-core),var(--package-glow-secondary),transparent)] opacity-70 blur-[0.6px]" />
      <span className="absolute left-[13%] top-[25%] h-1.5 w-1.5 rotate-45 bg-white shadow-[0_0_8px_2px_var(--package-glow-core)] motion-safe:animate-pulse" />
      <span className="absolute right-[12%] top-[18%] h-1 w-1 rotate-45 bg-white shadow-[0_0_7px_2px_var(--package-glow-secondary)] motion-safe:animate-[pulse_2.8s_ease-in-out_infinite]" />
      <span className="absolute bottom-[17%] right-[20%] h-1.5 w-1.5 rotate-45 bg-white shadow-[0_0_8px_2px_var(--package-glow-core)] motion-safe:animate-[pulse_3.2s_ease-in-out_infinite]" />
    </div>
  );
};

export const AiCoinsHeroTitle = () => (
  <div className="flex min-w-0 items-center gap-4">
    <img
      src={coinGoldImage}
      alt=""
      draggable={false}
      className="h-20 w-20 shrink-0 object-contain drop-shadow-[0_18px_38px_rgba(245,158,11,0.28)] sm:h-24 sm:w-24 [@media(max-height:820px)]:h-16 [@media(max-height:820px)]:w-16"
    />
    <div className="min-w-0">
      <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl [@media(max-height:820px)]:text-4xl">
        Buy{" "}
        <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
          AI Coins
        </span>
      </h1>
      <p className="mt-2 hidden text-base font-medium text-slate-300 sm:block [@media(max-height:820px)]:hidden">
        Choose the perfect pack for your next adventure
      </p>
    </div>
  </div>
);

export const AiCoinsBenefitsPanel = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "mt-5 grid overflow-hidden rounded-3xl border border-blue-400/18 bg-slate-950/56 shadow-inner shadow-blue-950/50 sm:grid-cols-2 lg:grid-cols-4 [@media(max-height:820px)]:mt-4",
      className,
    )}
  >
    {benefits.map((item, index) => (
      <div
        key={item.title}
        className={cn(
          "flex min-w-0 items-center gap-3 px-4 py-4 [@media(max-height:820px)]:py-3",
          index > 0 && "lg:border-l lg:border-white/8",
          index > 1 && "sm:border-t sm:border-white/8 lg:border-t-0",
        )}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] [@media(max-height:820px)]:h-9 [@media(max-height:820px)]:w-9">
          <item.icon className={cn("h-5 w-5", item.color)} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-white">
            {item.title}
          </span>
          <span className="block truncate text-xs text-slate-400">
            {item.description}
          </span>
        </span>
      </div>
    ))}
  </div>
);

const AiCoinsCompactHero = ({
  transition,
}: {
  transition: UpgradeModeTransition;
}) => (
  <>
    <MembershipCoinTopLayout
      activeTab="coins"
      visualTab={transition.visualMode}
      isTransitioning={transition.isTransitioning}
      onTabSelect={transition.switchMode}
      left={<AiCoinsHeroTitle />}
    />

    <AiCoinsBenefitsPanel />
  </>
);

const PackageBadge = ({
  label,
  featured,
}: {
  label: string;
  featured: boolean;
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
  <motion.span
    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: shouldReduceMotion ? 0.14 : 0.26,
      delay: shouldReduceMotion ? 0 : featured ? 0.2 : 0.08,
    }}
    className={cn(
      "absolute -top-3 right-3 z-10 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-lg",
      featured
        ? "bg-gradient-to-r from-orange-500 to-amber-300 shadow-amber-500/30"
        : "bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-violet-600/25",
    )}
  >
    {label}
  </motion.span>
  );
};

const PackagePrice = ({ pkg }: { pkg: AiCoinPackage }) => (
  <div className="flex min-w-0 items-baseline justify-center gap-2">
    {pkg.originalPrice ? (
      <span className="min-w-0 truncate text-xs font-bold text-slate-500 line-through 2xl:text-sm">
        {formatVnd(pkg.originalPrice)}
      </span>
    ) : null}
    <span className="whitespace-nowrap text-sm font-black text-white 2xl:text-base">
      {formatVnd(pkg.price)}
    </span>
  </div>
);

const PrimaryCoinPackageCard = ({
  pkg,
  onSelect,
  isSelected,
}: {
  pkg: AiCoinPackage;
  onSelect: PackageAction;
  isSelected: boolean;
}) => {
  const shouldReduceMotion = useReducedMotion();
  const featured = pkg.featured || pkg.badge === "BEST VALUE";
  const theme = getPackageTheme(pkg.id);
  const themeStyle = getPackageThemeStyle(theme);

  return (
    <motion.article
      whileHover={
        shouldReduceMotion ? undefined : { y: -4, scale: 1.008 }
      }
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex h-full min-w-0 flex-col overflow-visible rounded-3xl border p-4 text-center transition-[border-color,box-shadow] duration-200 [@media(max-height:820px)]:p-3",
        "hover:shadow-[0_18px_44px_rgba(2,6,23,0.34),0_0_30px_var(--package-glow),inset_0_1px_0_rgba(255,255,255,0.025)]",
      )}
      style={themeStyle}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_0%,var(--package-glow),transparent_36%)]" />
      {pkg.badge ? (
        <PackageBadge label={pkg.badge} featured={featured} />
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <h3
          className={cn(
            "min-h-10 text-sm font-black leading-tight 2xl:text-base",
            featured ? "text-amber-200" : "text-[var(--package-accent)]",
          )}
        >
          {pkg.name}
        </h3>
        <div className="relative isolate mt-2 flex h-28 items-center justify-center [@media(max-height:820px)]:h-24">
          <span className="pointer-events-none absolute inset-[10%_12%] -z-10 rounded-full bg-[radial-gradient(circle,var(--package-glow)_0%,transparent_70%)] blur-2xl" />
          <img
            src={pkg.image}
            alt={`${pkg.name} AI Coins package`}
            draggable={false}
            className="h-full w-20 object-contain"
          />
        </div>

        <p
          className={cn(
            "mt-3 text-3xl font-black tabular-nums tracking-tight 2xl:text-4xl [@media(max-height:820px)]:mt-2 [@media(max-height:820px)]:text-3xl",
            featured ? "text-amber-200" : "text-slate-100",
          )}
        >
          {formatNumber(pkg.coins)}
        </p>
        <p className="text-sm font-semibold text-slate-300">AI Coins</p>

        <p
          className="mx-auto mt-3 inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-[11px] font-black [@media(max-height:820px)]:mt-2"
          style={{
            background: "var(--package-bonus-bg)",
            borderColor: "var(--package-border)",
            color: "var(--package-bonus-text)",
          }}
        >
          +{formatNumber(pkg.bonusCoins)} Bonus Coins
        </p>

        <div className="mt-auto pt-4 [@media(max-height:820px)]:pt-3">
          <PackagePrice pkg={pkg} />
          <button
            type="button"
            onClick={() => onSelect(pkg)}
            disabled={pkg.comingSoon || isSelected}
            className={cn(
              "mt-3 h-10 w-full rounded-xl border px-3 text-sm font-black text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70 hover:shadow-[0_0_18px_var(--package-glow)]",
              featured
                ? "shadow-[0_12px_26px_rgba(245,158,11,0.25)] focus:ring-amber-300"
                : "border-violet-400/60 bg-violet-600/24 hover:bg-violet-600/38 focus:ring-violet-300",
            )}
            style={{
              background: "var(--package-button-bg)",
              borderColor: "var(--package-button-border)",
            }}
          >
            {pkg.comingSoon ? "Coming soon" : (isSelected ? "Selected" : "Choose package")}
          </button>
        </div>
      </div>
    </motion.article>
  );
};

const LargeCoinPackageCard = ({
  pkg,
  onSelect,
  isSelected,
}: {
  pkg: AiCoinPackage;
  onSelect: PackageAction;
  isSelected: boolean;
}) => {
  const shouldReduceMotion = useReducedMotion();
  const theme = getPackageTheme(pkg.id);
  const themeStyle = getPackageThemeStyle(theme);

  return (
    <motion.article
      whileHover={
        shouldReduceMotion ? undefined : { y: -4, scale: 1.008 }
      }
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full min-h-0 min-w-0 flex-col overflow-visible rounded-3xl border p-3.5 transition-[border-color,box-shadow] duration-300 hover:shadow-[0_18px_44px_rgba(2,6,23,0.34),0_0_30px_var(--package-glow),inset_0_1px_0_rgba(255,255,255,0.025)] 2xl:p-4 [@media(max-height:820px)]:p-3"
      style={themeStyle}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_26%_0%,var(--package-glow),transparent_38%)]" />
      {pkg.badge ? <PackageBadge label={pkg.badge} featured={false} /> : null}
      <div className="relative grid min-w-0 flex-1 grid-cols-[minmax(100px,40%)_minmax(0,1fr)] items-center gap-3 2xl:grid-cols-[minmax(110px,42%)_minmax(0,1fr)] 2xl:gap-4">
        <div className="relative isolate flex min-w-0 items-center justify-center overflow-visible">
          <span className="pointer-events-none absolute inset-[10%_8%] -z-20 rounded-full bg-[radial-gradient(circle,var(--package-glow)_0%,transparent_70%)] blur-2xl" />
          <CosmicPackageGlow packageId={pkg.id} />
          <img
            src={pkg.image}
            alt={`${pkg.name} AI Coins package`}
            draggable={false}
            className={cn(
              "relative z-10 mx-auto h-[112px] w-full max-w-[150px] object-contain 2xl:h-32 [@media(max-height:820px)]:h-[100px]",
              cosmicPackageIds.has(pkg.id) &&
                "drop-shadow-[0_0_12px_var(--package-glow-secondary)] transition-[filter,transform] duration-300 group-hover:scale-[1.02] group-hover:drop-shadow-[0_0_18px_var(--package-glow-core)]",
            )}
          />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-[var(--package-accent)]">
            {pkg.name}
          </h3>
          <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-slate-100 2xl:text-3xl">
            {formatNumber(pkg.coins)}
          </p>
          <p className="text-sm font-semibold text-slate-300">AI Coins</p>
          <p
            className="mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black"
            style={{
              background: "var(--package-bonus-bg)",
              borderColor: "var(--package-border)",
              color: "var(--package-bonus-text)",
            }}
          >
            +{formatNumber(pkg.bonusCoins)} Bonus Coins
          </p>
          <div className="mt-3">
            <PackagePrice pkg={pkg} />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSelect(pkg)}
        disabled={pkg.comingSoon || isSelected}
        className="relative mt-3 h-10 w-full rounded-xl border px-3 text-sm font-black text-white transition hover:shadow-[0_0_18px_var(--package-glow)] focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          background: "var(--package-button-bg)",
          borderColor: "var(--package-button-border)",
        }}
      >
        {pkg.comingSoon ? "Coming soon" : (isSelected ? "Selected" : "Choose package")}
      </button>
    </motion.article>
  );
};

const DailyCoinPassCard = ({
  pkg,
  onSelect,
  isSelected,
}: {
  pkg: AiCoinPackage;
  onSelect: PackageAction;
  isSelected: boolean;
}) => {
  const shouldReduceMotion = useReducedMotion();
  const theme = getPackageTheme(pkg.id);
  const themeStyle = getPackageThemeStyle(theme);

  return (
    <motion.article
      whileHover={
        shouldReduceMotion ? undefined : { y: -4, scale: 1.008 }
      }
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full min-h-0 min-w-0 flex-col overflow-visible rounded-3xl border p-3.5 transition-[border-color,box-shadow] duration-200 hover:shadow-[0_18px_44px_rgba(2,6,23,0.34),0_0_30px_var(--package-glow),inset_0_1px_0_rgba(255,255,255,0.025)] 2xl:p-4 [@media(max-height:820px)]:p-3"
      style={themeStyle}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_20%_0%,var(--package-glow),transparent_34%)]" />
      {pkg.badge ? <PackageBadge label={pkg.badge} featured /> : null}
      <div className="relative grid min-w-0 flex-1 grid-cols-[minmax(100px,40%)_minmax(0,1fr)] items-center gap-3 2xl:grid-cols-[minmax(116px,42%)_minmax(0,1fr)] 2xl:gap-4">
        <div className="relative isolate flex min-w-0 items-center justify-center">
          <span className="pointer-events-none absolute inset-[10%_8%] -z-10 rounded-full bg-[radial-gradient(circle,var(--package-glow)_0%,transparent_70%)] blur-2xl" />
          <img
            src={pkg.image}
            alt={`${pkg.name} AI Coins package`}
            draggable={false}
            className="mx-auto h-[112px] w-full max-w-[150px] object-contain 2xl:h-32 [@media(max-height:820px)]:h-[100px]"
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-black text-[var(--package-accent)]">
            {pkg.name}
          </h3>
          <p className="mt-2 text-sm leading-5 text-slate-300">
            Get 100 AI Coins every day for 30 consecutive days
          </p>
          <p className="mt-3 text-xl font-black text-[var(--package-accent)] 2xl:text-2xl">
            {formatVnd(3000)}
            <span className="text-sm font-semibold text-slate-300">
              {" "}
              / day
            </span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSelect(pkg)}
        disabled={pkg.comingSoon || isSelected}
        className="relative mt-3 h-10 w-full rounded-xl border px-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(245,158,11,0.24)] transition hover:shadow-[0_0_18px_var(--package-glow)] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          background: "var(--package-button-bg)",
          borderColor: "var(--package-button-border)",
        }}
      >
        {pkg.comingSoon ? "Coming soon" : (isSelected ? "Selected" : "Choose package")}
      </button>
    </motion.article>
  );
};

const PaymentSecurityPanel = () => (
  <section className="grid gap-5 rounded-3xl border border-blue-400/18 bg-slate-950/56 p-5 shadow-[0_18px_44px_rgba(2,8,23,0.20)] lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)] lg:items-center [@media(max-height:820px)]:p-4">
    <div className="min-w-0">
      <h2 className="text-sm font-black text-white">Payment methods</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {paymentMethods.map((method) => (
          <div
            key={method}
            className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200"
          >
            <CreditCard className="h-4 w-4 shrink-0 text-blue-300" />
            <span className="truncate">{method}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex min-w-0 items-center gap-4 rounded-3xl border border-violet-300/18 bg-violet-500/8 p-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-violet-300/24 bg-violet-400/10">
        <Lock className="h-8 w-8 text-violet-200" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-black text-white">
          100% Secure Payment
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          Your information is always protected
        </p>
      </div>
    </div>
  </section>
);

export const AiCoinsUpgradeContent: React.FC<{
  transition: UpgradeModeTransition;
  showBenefits?: boolean;
}> = ({ transition, showBenefits = false }) => {
  const shouldReduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { openAuthenticationModal } = useAuthenticationGate();
  const { openAiCoinsModal, isOpen: isAiCoinsModalOpen, options: modalOptions } = useAiCoinsModal();
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  const handleSelectPackage = (pkg: AiCoinPackage) => {
    if (!isAuthenticated) {
      openAuthenticationModal({ returnTo: "/ai-coins", reason: "payment" });
      return;
    }

    if (pkg.comingSoon) {
      setActionMessage(`${pkg.name} is not enabled yet.`);
      return;
    }

    openAiCoinsModal({ packageId: pkg.id, step: 'payment' });
  };

  const isLoading = false;
  const loadError = false;
  const allPrimaryPackages = primaryCoinPackages.filter((pkg) => pkg.active);
  const allLargePackages = largeCoinPackages.filter((pkg) => pkg.active);

  return (
    <>
      {actionMessage ? (
        <div className="mt-5 flex items-start gap-3 rounded-3xl border border-blue-300/20 bg-blue-400/10 p-4 text-sm font-bold text-blue-100 [@media(max-height:820px)]:mt-4">
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-blue-200" />
          <span>{actionMessage}</span>
        </div>
      ) : null}

      <motion.section
        aria-busy={transition.isTransitioning}
        className="mt-6 min-w-0 space-y-5 [@media(max-height:820px)]:mt-4 [@media(max-height:820px)]:space-y-4"
      >
        {showBenefits ? <AiCoinsBenefitsPanel className="mt-0" /> : null}

        {isLoading ? (
          <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[330px] animate-pulse rounded-3xl border border-blue-400/12 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : loadError ? (
          <section className="rounded-3xl border border-red-300/20 bg-red-500/10 p-6 text-center">
            <h2 className="text-lg font-black text-red-100">
              Unable to load AI Coins packages.
            </h2>
            <p className="mt-2 text-sm text-red-100/80">Please try again.</p>
          </section>
        ) : allPrimaryPackages.length === 0 ? (
          <section className="rounded-3xl border border-blue-300/20 bg-white/[0.04] p-6 text-center">
            <h2 className="text-lg font-black text-white">
              No AI Coins packages available at the moment.
            </h2>
          </section>
        ) : (
          <motion.section
            variants={cardContainerVariants}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            className="grid min-w-0 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 2xl:gap-4"
          >
            {allPrimaryPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                variants={cardItemVariants}
                className="h-full min-w-0"
              >
                <PrimaryCoinPackageCard
                  pkg={pkg}
                  onSelect={handleSelectPackage}
                  isSelected={isAiCoinsModalOpen && modalOptions.packageId === pkg.id}
                />
              </motion.div>
            ))}
          </motion.section>
        )}

        <motion.section
          variants={cardContainerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          className="grid min-w-0 items-stretch gap-3 lg:grid-cols-2 min-[1280px]:grid-cols-[repeat(3,minmax(0,1fr))_minmax(280px,1.05fr)] 2xl:gap-4"
        >
          {allLargePackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              variants={cardItemVariants}
              className="h-full min-w-0"
            >
              <LargeCoinPackageCard 
                pkg={pkg} 
                onSelect={handleSelectPackage} 
                isSelected={isAiCoinsModalOpen && modalOptions.packageId === pkg.id}
              />
            </motion.div>
          ))}
          <motion.div variants={cardItemVariants} className="h-full min-w-0">
            <DailyCoinPassCard
              pkg={dailyCoinPassPackage}
              onSelect={handleSelectPackage}
              isSelected={isAiCoinsModalOpen && modalOptions.packageId === dailyCoinPassPackage.id}
            />
          </motion.div>
        </motion.section>

        <PaymentSecurityPanel />
      </motion.section>
    </>
  );
};

export const AiCoinsPage: React.FC = () => {
  const transition = useUpgradeModeTransition();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(50,65,150,0.14),transparent_38%),linear-gradient(180deg,#020817_0%,#031127_55%,#020817_100%)] text-white">
      <UpgradeThemeGlow mode={transition.visualMode} phase={transition.phase} />
      <div className="relative z-10 mx-auto w-[min(calc(100%_-_40px),1720px)] pb-8 pt-5 [@media(max-height:820px)]:pb-6 [@media(max-height:820px)]:pt-4">
        <motion.div {...transition.pageMotionProps}>
          <AiCoinsCompactHero transition={transition} />
          <AiCoinsUpgradeContent transition={transition} />
        </motion.div>
      </div>
    </main>
  );
};
