import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeHelp,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gamepad2,
  Gift,
  Headphones,
  History,
  Luggage,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  TicketPercent,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import coinImage from "../../../assets/images/coin.png";
import giftboxImage from "../../../assets/images/giftbox.png";
import {
  demoRedemptionHistory,
  demoRewardWallet,
  rewardItems,
  type RedemptionHistoryItem,
  type RewardCategory,
  type RewardItem,
} from "./rewardData";
import {
  rewardsCardVariants,
  rewardsEase,
  rewardsGridVariants,
  rewardsHeroVariants,
  rewardsModalVariants,
  rewardsPageVariants,
  rewardsSidebarItemVariants,
} from "./rewardsMotion";
import "./RewardRedemptionPage.css";

type SortOption = "newest" | "lowest" | "highest" | "popular";
type MobileRewardSortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "popular";
type ModalState =
  | { kind: "confirm"; reward: RewardItem }
  | { kind: "success"; reward: RewardItem }
  | { kind: "history" }
  | { kind: "guide" }
  | null;

const categoryItems: Array<{
  id: RewardCategory;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "all", label: "All Rewards", icon: Gift },
  { id: "mobile-top-up", label: "Mobile Top-Up", icon: Smartphone },
  { id: "game-cards", label: "Game Cards", icon: Gamepad2 },
  { id: "vouchers", label: "Vouchers & Discounts", icon: TicketPercent },
  { id: "tech-gifts", label: "Tech Gifts", icon: Headphones },
  { id: "travel-gifts", label: "Travel Souvenirs", icon: Luggage },
  { id: "services", label: "Services & More", icon: Sparkles },
];

const topTabs: Array<{ id: RewardCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "mobile-top-up", label: "Mobile Top-Up" },
  { id: "game-cards", label: "Game Cards" },
  { id: "vouchers", label: "Vouchers" },
  { id: "tech-gifts", label: "Tech Gifts" },
  { id: "travel-gifts", label: "More" },
];

const sortLabels: Record<SortOption, string> = {
  newest: "Newest",
  lowest: "Lowest Price",
  highest: "Highest Price",
  popular: "Most Popular",
};

const mobileSortLabels: Record<MobileRewardSortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "price-asc": "Lowest Coin Cost",
  "price-desc": "Highest Coin Cost",
  popular: "Most Popular",
};

const mobileCategoryItems: Array<{
  id: RewardCategory;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "all", label: "All", icon: Gift },
  { id: "mobile-top-up", label: "Mobile Top-Up", icon: Smartphone },
  { id: "game-cards", label: "Game Cards", icon: Gamepad2 },
  { id: "vouchers", label: "Vouchers", icon: TicketPercent },
  { id: "tech-gifts", label: "Tech Gifts", icon: Headphones },
  { id: "travel-gifts", label: "Other Rewards", icon: Luggage },
];

const formatCoins = (amount: number) => amount.toLocaleString("en-US");

const RewardArtwork: React.FC<{ reward: RewardItem }> = ({ reward }) => {
  return (
    <div className={`reward-card__image-wrapper reward-card__image-wrapper--${reward.visual}`}>
      <img
        src={reward.image}
        alt={reward.imageAlt}
        className={`reward-card__image reward-card__image--${reward.visual}`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

const MobileRewardCard: React.FC<{
  reward: RewardItem;
  onRedeem: (reward: RewardItem) => void;
}> = ({ reward, onRedeem }) => {
  const canRedeem = demoRewardWallet.specialCoins >= reward.price;
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      className="mobile-reward-card"
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.14, ease: rewardsEase }}
    >
      {reward.badge && (
        <span className="mobile-reward-card__badge">{reward.badge}</span>
      )}
      <h3>{reward.name}</h3>
      <RewardArtwork reward={reward} />
      <p>{reward.displayValue ?? "Premium reward"}</p>
      <div className="mobile-reward-card__footer">
        <span className="mobile-reward-card__price">
          <img src={coinImage} alt="Special Coin" />
          {formatCoins(reward.price)}
        </span>
        <button
          type="button"
          disabled={!canRedeem}
          onClick={() => onRedeem(reward)}
        >
          {canRedeem ? "Redeem Now" : "Not Enough Coins"}
        </button>
      </div>
    </motion.article>
  );
};

const Modal: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    firstFocusable?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ) ?? [],
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[1300] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.12 : 0.2, ease: rewardsEase }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[22px] border border-violet-300/30 bg-[linear-gradient(160deg,#15103b,#0c1230)] p-5 text-white shadow-[0_24px_80px_rgba(2,6,23,0.5)]"
        variants={rewardsModalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={
          shouldReduceMotion
            ? { duration: 0.14 }
            : undefined
        }
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

const HistoryRow: React.FC<{ item: RedemptionHistoryItem }> = ({ item }) => (
  <li className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0">
    <span className="min-w-0">
      <strong className="block truncate text-sm text-white">
        {item.reward}
      </strong>
      <small className="text-xs text-slate-400">{item.redeemedAt}</small>
    </span>
    <span className="shrink-0 text-right">
      <strong className="block text-sm text-amber-300">
        {formatCoins(item.cost)} SC
      </strong>
      <small className="text-xs font-semibold text-violet-200">
        {item.status}
      </small>
    </span>
  </li>
);

export const RewardRedemptionPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [category, setCategory] = React.useState<RewardCategory>("all");
  const [sort, setSort] = React.useState<SortOption>("newest");
  const [mobileSort, setMobileSort] =
    React.useState<MobileRewardSortOption>("newest");
  const [mobilePage, setMobilePage] = React.useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);
  const [availableOnly, setAvailableOnly] = React.useState(false);
  const [affordableOnly, setAffordableOnly] = React.useState(false);
  const [modal, setModal] = React.useState<ModalState>(null);
  const pageContainerRef = React.useRef<HTMLDivElement>(null);
  const mobileRewardsRef = React.useRef<HTMLElement>(null);
  const mobileFilterSheetRef = React.useRef<HTMLElement>(null);

  const updateSidebarMetrics = React.useCallback(() => {
    const container = pageContainerRef.current;
    if (!container) return;

    if (window.innerWidth < 1280) {
      container.style.removeProperty("--rewards-sidebar-top");
      container.style.removeProperty("--rewards-sidebar-max-height");
      return;
    }

    const header = document.querySelector<HTMLElement>("header");
    const viewportPadding = 20;
    const top = Math.round(
      Math.max(header?.getBoundingClientRect().bottom ?? 0, 0) + 24,
    );
    const maxHeight = Math.max(
      0,
      Math.floor(window.innerHeight - top - viewportPadding),
    );

    container.style.setProperty("--rewards-sidebar-top", `${top}px`);
    container.style.setProperty(
      "--rewards-sidebar-max-height",
      `${maxHeight}px`,
    );
  }, []);

  React.useLayoutEffect(() => {
    updateSidebarMetrics();

    const header = document.querySelector<HTMLElement>("header");
    const observer = new ResizeObserver(updateSidebarMetrics);
    if (header) observer.observe(header);
    window.addEventListener("resize", updateSidebarMetrics);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSidebarMetrics);
    };
  }, [updateSidebarMetrics]);

  React.useEffect(() => {
    document.body.classList.add("rewards-mobile-route");
    return () => document.body.classList.remove("rewards-mobile-route");
  }, []);

  React.useEffect(() => {
    if (!mobileFilterOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFilterOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileFilterOpen]);

  const visibleRewards = React.useMemo(() => {
    const filtered =
      category === "all"
        ? rewardItems
        : rewardItems.filter((item) => item.category === category);
    return [...filtered].sort((left, right) => {
      if (sort === "lowest") return left.price - right.price;
      if (sort === "highest") return right.price - left.price;
      if (sort === "popular")
        return Number(Boolean(right.badge)) - Number(Boolean(left.badge));
      return 0;
    });
  }, [category, sort]);

  const desktopResultKey = `${category}|${sort}`;
  const gridMotionVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.14 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : rewardsGridVariants;
  const cardMotionVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.14 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : rewardsCardVariants;

  const selectCategory = (nextCategory: RewardCategory) =>
    setCategory(nextCategory);

  const mobileRewards = React.useMemo(() => {
    const filtered = rewardItems
      .filter((item) => category === "all" || item.category === category)
      .filter(
        (item) =>
          !affordableOnly || item.price <= demoRewardWallet.specialCoins,
      )
      // The current demo catalog has no inventory state; every entry is available.
      .filter(() => !availableOnly || true);

    return [...filtered].sort((left, right) => {
      if (mobileSort === "oldest")
        return rewardItems.indexOf(right) - rewardItems.indexOf(left);
      if (mobileSort === "price-asc") return left.price - right.price;
      if (mobileSort === "price-desc") return right.price - left.price;
      if (mobileSort === "popular")
        return Number(Boolean(right.badge)) - Number(Boolean(left.badge));
      return rewardItems.indexOf(left) - rewardItems.indexOf(right);
    });
  }, [affordableOnly, availableOnly, category, mobileSort]);

  const mobileItemsPerPage = 6;
  const mobilePageCount = Math.max(
    1,
    Math.ceil(mobileRewards.length / mobileItemsPerPage),
  );
  const mobileVisibleRewards = React.useMemo(
    () =>
      mobileRewards.slice(
        (mobilePage - 1) * mobileItemsPerPage,
        mobilePage * mobileItemsPerPage,
      ),
    [mobilePage, mobileRewards],
  );
  const mobileResultKey = `${category}|${mobileSort}|${mobilePage}|${availableOnly}|${affordableOnly}`;
  const otherAttractiveRewards = React.useMemo(
    () =>
      rewardItems.filter(
        (item) =>
          item.category === "tech-gifts" || item.category === "travel-gifts",
      ),
    [],
  );

  const updateMobileCategory = (nextCategory: RewardCategory) => {
    setCategory(nextCategory);
    setMobilePage(1);
  };

  const updateMobileSort = (nextSort: MobileRewardSortOption) => {
    setMobileSort(nextSort);
    setMobilePage(1);
  };

  const changeMobilePage = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), mobilePageCount);
    setMobilePage(clampedPage);
    window.requestAnimationFrame(() => {
      mobileRewardsRef.current?.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const handleMobileFilterKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      mobileFilterSheetRef.current?.querySelectorAll<HTMLElement>(
        "button, input, [tabindex]:not([tabindex='-1'])",
      ) ?? [],
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <motion.main
      className="rewards-page min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_50%_-8%,rgba(168,85,247,0.21),transparent_28%),radial-gradient(circle_at_94%_40%,rgba(236,72,153,0.10),transparent_26%),linear-gradient(180deg,#070a21_0%,#0c0826_48%,#080a1d_100%)] px-0 py-0 text-white xl:px-8 xl:py-8"
      variants={rewardsPageVariants}
      initial="hidden"
      animate="visible"
      transition={shouldReduceMotion ? { duration: 0.14 } : undefined}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_80%,rgba(124,58,237,0.12),transparent_22%),radial-gradient(circle_at_84%_8%,rgba(250,204,21,0.08),transparent_16%)]" />
      <section className="rewards-mobile-view relative mx-auto w-full max-w-[720px] px-4 pb-8 pt-[max(14px,env(safe-area-inset-top))] sm:px-6 xl:hidden">
        <header className="rewards-mobile-topbar">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rewards-mobile-icon-button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1>Redeem Rewards</h1>
          <span
            className="rewards-mobile-balance"
            aria-label={`${formatCoins(demoRewardWallet.specialCoins)} Special Coins`}
          >
            <img src={coinImage} alt="" aria-hidden="true" />
            {formatCoins(demoRewardWallet.specialCoins)}
            <Plus className="h-4 w-4" aria-hidden="true" />
          </span>
        </header>

        <div className="rewards-mobile-intro">
          <h2>Redeem Rewards</h2>
          <p>Use your Special Coins to redeem exclusive rewards</p>
        </div>

        <section
          className="rewards-mobile-wallet"
          aria-label="Special Coins summary"
        >
          <img
            src={giftboxImage}
            alt=""
            aria-hidden="true"
            className="rewards-mobile-wallet__image"
          />
          <span className="rewards-mobile-wallet__copy">
            <span>Your Special Coins</span>
            <strong>{formatCoins(demoRewardWallet.specialCoins)}</strong>
            <small>
              {formatCoins(demoRewardWallet.expiringCoins)} coins expiring soon
            </small>
          </span>
          <button type="button" onClick={() => setModal({ kind: "history" })}>
            <History className="h-4 w-4" />
            <span>Redemption History</span>
          </button>
        </section>

        <nav
          className="rewards-mobile-categories"
          aria-label="Reward categories"
        >
          {mobileCategoryItems.map((item) => {
            const Icon = item.icon;
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => updateMobileCategory(item.id)}
                className={active ? "is-active" : ""}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section ref={mobileRewardsRef} className="rewards-mobile-products">
          <div className="rewards-mobile-section-heading">
            <span>
              <Flame className="h-5 w-5 text-orange-400" /> Hot Products
            </span>
            <button type="button" onClick={() => updateMobileCategory("all")}>
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="rewards-mobile-products__toolbar">
            <span>{mobileRewards.length} rewards available</span>
            <button type="button" onClick={() => setMobileFilterOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" /> Sort:{" "}
              {mobileSortLabels[mobileSort]}
            </button>
          </div>

          {mobileVisibleRewards.length ? (
            <AnimatePresence initial={false} mode="sync">
              <motion.div
                key={mobileResultKey}
                className="rewards-mobile-grid"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
                transition={{ duration: shouldReduceMotion ? 0.14 : 0.22, ease: rewardsEase }}
              >
                {mobileVisibleRewards.map((reward) => (
                  <MobileRewardCard
                    key={reward.id}
                    reward={reward}
                    onRedeem={(nextReward) =>
                      setModal({ kind: "confirm", reward: nextReward })
                    }
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="rewards-mobile-empty">
              No rewards match your current filters.
            </div>
          )}

          <nav
            className="rewards-mobile-pagination"
            aria-label="Rewards pagination"
          >
            <motion.button
              type="button"
              aria-label="Previous page"
              disabled={mobilePage === 1}
              onClick={() => changeMobilePage(mobilePage - 1)}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            {Array.from(
              { length: mobilePageCount },
              (_, index) => index + 1,
            ).map((page) => (
              <motion.button
                key={page}
                type="button"
                aria-current={page === mobilePage ? "page" : undefined}
                className="relative overflow-hidden"
                onClick={() => changeMobilePage(page)}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              >
                {page === mobilePage && (
                  <motion.span
                    layoutId="rewards-mobile-pagination-active"
                    className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_16px_rgba(168,85,247,0.36)]"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34 }
                    }
                  />
                )}
                <span className="relative z-10">{page}</span>
              </motion.button>
            ))}
            <motion.button
              type="button"
              aria-label="Next page"
              disabled={mobilePage === mobilePageCount}
              onClick={() => changeMobilePage(mobilePage + 1)}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </nav>
        </section>

        <section className="rewards-mobile-other">
          <div className="rewards-mobile-section-heading">
            <span>
              <Gift className="h-5 w-5 text-fuchsia-300" /> Other Attractive
              Rewards
            </span>
            <button
              type="button"
              onClick={() => updateMobileCategory("travel-gifts")}
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="rewards-mobile-other__rail">
            {otherAttractiveRewards.map((reward) => (
              <button
                key={reward.id}
                type="button"
                onClick={() => setModal({ kind: "confirm", reward })}
              >
                <RewardArtwork reward={reward} />
                <strong>{reward.name}</strong>
                <span>
                  <img src={coinImage} alt="Special Coin" />{" "}
                  {formatCoins(reward.price)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section
          className="rewards-mobile-trust"
          aria-label="Reward redemption support"
        >
          <ShieldCheck className="h-5 w-5" /> Secure rewards
          <Zap className="h-5 w-5" /> Fast processing
          <Headphones className="h-5 w-5" /> 24/7 support
        </section>
      </section>

      {mobileFilterOpen && (
        <div
          className="rewards-mobile-filter-backdrop"
          role="presentation"
          onMouseDown={() => setMobileFilterOpen(false)}
        >
          <section
            ref={mobileFilterSheetRef}
            className="rewards-mobile-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Sort and filter rewards"
            onKeyDown={handleMobileFilterKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="rewards-mobile-filter-sheet__handle" />
            <div className="rewards-mobile-filter-sheet__header">
              <h2>Sort & Filter</h2>
              <button
                type="button"
                autoFocus
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close sort and filter"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <fieldset>
              <legend>Sort by</legend>
              {(Object.keys(mobileSortLabels) as MobileRewardSortOption[]).map(
                (option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name="mobile-reward-sort"
                      checked={mobileSort === option}
                      onChange={() => updateMobileSort(option)}
                    />{" "}
                    <span>{mobileSortLabels[option]}</span>
                    <Check className="h-4 w-4" />
                  </label>
                ),
              )}
            </fieldset>
            <fieldset>
              <legend>Availability</legend>
              <label>
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) => {
                    setAvailableOnly(event.target.checked);
                    setMobilePage(1);
                  }}
                />{" "}
                <span>Available Only</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={affordableOnly}
                  onChange={(event) => {
                    setAffordableOnly(event.target.checked);
                    setMobilePage(1);
                  }}
                />{" "}
                <span>Affordable With My Balance</span>
              </label>
            </fieldset>
            <div className="rewards-mobile-filter-sheet__actions">
              <button
                type="button"
                onClick={() => {
                  setMobileSort("newest");
                  setAvailableOnly(false);
                  setAffordableOnly(false);
                  setMobilePage(1);
                }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobilePage(1);
                  setMobileFilterOpen(false);
                }}
              >
                Apply Filters
              </button>
            </div>
          </section>
        </div>
      )}

      <div
        ref={pageContainerRef}
        className="relative mx-auto w-[min(100%,1720px)]"
      >
        <motion.header
          className="mb-7 hidden flex-col items-center gap-4 text-center sm:mb-8 lg:flex-row lg:justify-between lg:text-left xl:flex"
          variants={rewardsHeroVariants}
          initial="hidden"
          animate="visible"
          transition={shouldReduceMotion ? { duration: 0.14 } : undefined}
        >
          <div className="hidden w-56 lg:block" aria-hidden="true" />
          <div>
            <div
              className="mb-2 flex items-center justify-center gap-3 text-amber-300 lg:justify-start"
              aria-hidden="true"
            >
              <Sparkles className="h-5 w-5" />
              <span className="h-px w-9 bg-amber-300/60" />
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="bg-[linear-gradient(90deg,#fde68a,#fb7185,#c084fc)] bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-[0_0_20px_rgba(192,132,252,0.4)] sm:text-5xl">
              REDEEM REWARDS
            </h1>
            <p className="mt-3 text-base font-medium text-slate-300 sm:text-lg">
              Use your Special Coins to redeem exclusive rewards
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ kind: "history" })}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-violet-300/35 bg-violet-500/12 px-4 text-sm font-bold text-white transition hover:border-violet-200/70 hover:bg-violet-400/20 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <History className="h-4 w-4" />
            Redemption History
          </button>
        </motion.header>

        <div className="rewards-main-boundary hidden gap-5 xl:grid xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] xl:items-stretch">
          <aside className="rewards-sidebar-column hidden xl:block" aria-label="Rewards sidebar">
            <div
              className="rewards-sidebar rounded-[22px] border border-violet-400/25 bg-[linear-gradient(180deg,rgba(22,14,58,0.94),rgba(10,14,39,0.96))] p-4 shadow-[0_18px_50px_rgba(2,6,23,0.24)]"
            >
              <motion.section
                className="rounded-2xl border border-violet-300/25 bg-violet-500/10 p-4"
                variants={rewardsSidebarItemVariants}
                initial="hidden"
                animate="visible"
                transition={shouldReduceMotion ? { duration: 0.14 } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 shadow-[0_0_22px_rgba(168,85,247,0.22)]">
                    <img
                      src={coinImage}
                      alt=""
                      aria-hidden="true"
                      className="h-9 w-9 object-contain"
                    />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-violet-200">
                      Your Special Coins
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-amber-300">
                      {formatCoins(demoRewardWallet.specialCoins)}
                    </strong>
                  </span>
                </div>
                <p className="mt-4 border-t border-violet-200/15 pt-3 text-xs font-medium text-slate-300">
                  Expiring soon:{" "}
                  <strong className="text-amber-300">
                    {formatCoins(demoRewardWallet.expiringCoins)}
                  </strong>
                </p>
              </motion.section>

              <motion.div
                className="rewards-sidebar__scroll"
                variants={rewardsSidebarItemVariants}
                initial="hidden"
                animate="visible"
                transition={shouldReduceMotion ? { duration: 0.14, delay: 0.02 } : { delay: 0.06 }}
              >
                <nav aria-label="Reward categories" className="space-y-1.5">
                  {categoryItems.map((item) => {
                    const Icon = item.icon;
                    const active = category === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectCategory(item.id)}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${active ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]" : "text-slate-200 hover:bg-white/8 hover:text-white"}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <button
                  type="button"
                  onClick={() => setModal({ kind: "guide" })}
                  className="mt-3 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-violet-300/25 bg-violet-500/10 p-3 text-left transition hover:border-violet-200/55 hover:bg-violet-500/15 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  <BadgeHelp className="h-8 w-8 text-fuchsia-300" />
                  <span className="min-w-0">
                    <strong className="block text-sm text-white">
                      Reward Redemption Guide
                    </strong>
                    <small className="mt-1 block text-xs leading-4 text-slate-300">
                      Learn how to redeem and receive rewards quickly
                    </small>
                  </span>
                  <ArrowRight className="h-4 w-4 text-violet-200" />
                </button>
              </motion.div>
            </div>
          </aside>

          <motion.section
            className="min-w-0"
            variants={rewardsHeroVariants}
            initial="hidden"
            animate="visible"
            transition={shouldReduceMotion ? { duration: 0.14 } : { delay: 0.08 }}
          >
            <div className="mb-4 flex rounded-2xl border border-violet-300/20 bg-violet-500/10 p-3 xl:hidden">
              <img
                src={coinImage}
                alt=""
                aria-hidden="true"
                className="mr-3 h-10 w-10 object-contain"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-violet-100">
                  Your Special Coins
                </span>
                <strong className="text-xl font-black text-amber-300">
                  {formatCoins(demoRewardWallet.specialCoins)}
                </strong>
              </span>
              <span className="text-right text-xs text-slate-300">
                Expiring soon
                <br />
                <strong className="text-amber-300">
                  {formatCoins(demoRewardWallet.expiringCoins)}
                </strong>
              </span>
            </div>

            <div
              className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Reward filters"
            >
              {topTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={category === tab.id}
                  onClick={() => selectCategory(tab.id)}
                  className={`relative h-10 shrink-0 overflow-hidden rounded-full border px-4 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${category === tab.id ? "border-violet-300/70 text-white" : "border-violet-300/20 bg-slate-950/35 text-slate-300 hover:border-violet-300/45 hover:text-white"}`}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  {category === tab.id && (
                    <motion.span
                      layoutId="rewards-desktop-category-active"
                      className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_0_18px_rgba(168,85,247,0.22)]"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 380, damping: 34 }
                      }
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="mb-4 mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-300">
                <strong className="text-white">{visibleRewards.length}</strong>{" "}
                rewards available
              </p>
              <label className="relative shrink-0">
                <span className="sr-only">Sort rewards</span>
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as SortOption)
                  }
                  className="h-10 appearance-none rounded-xl border border-violet-300/25 bg-slate-950/55 py-2 pl-3 pr-9 text-sm font-semibold text-white outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-300/50"
                >
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >{`Sort by: ${label}`}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-200" />
              </label>
            </div>

            {visibleRewards.length ? (
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={desktopResultKey}
                  className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                  variants={gridMotionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {visibleRewards.map((reward) => {
                  const canRedeem =
                    demoRewardWallet.specialCoins >= reward.price;
                  return (
                    <motion.article
                      key={reward.id}
                      variants={cardMotionVariants}
                      className="group relative flex min-h-[242px] flex-col rounded-2xl border border-violet-400/25 bg-[linear-gradient(180deg,rgba(13,11,41,0.96),rgba(18,13,54,0.98))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/55 hover:shadow-[0_14px_32px_rgba(76,29,149,0.20)]"
                      whileHover={
                        shouldReduceMotion ? undefined : { y: -3, scale: 1.008 }
                      }
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.992 }}
                      transition={{ duration: 0.18, ease: rewardsEase }}
                    >
                      {reward.badge && (
                        <span className="absolute right-2 top-2 z-10 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white shadow-lg">
                          {reward.badge}
                        </span>
                      )}
                      <RewardArtwork reward={reward} />
                      <h2 className="mt-3 min-h-10 text-sm font-black leading-5 text-white">
                        {reward.name}
                      </h2>
                      <p className="mt-1 min-h-4 text-xs font-medium text-slate-400">
                        {reward.displayValue ?? "Premium reward"}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        <span className="inline-flex items-center gap-1 text-sm font-black text-amber-300">
                          <img
                            src={coinImage}
                            alt="Special Coin"
                            className="h-5 w-5 object-contain"
                          />
                          {formatCoins(reward.price)}
                        </span>
                        <button
                          type="button"
                          disabled={!canRedeem}
                          onClick={() => setModal({ kind: "confirm", reward })}
                          className="min-h-9 rounded-xl border border-violet-400/70 bg-gradient-to-br from-violet-800 to-fuchsia-900 px-3 text-xs font-black text-white transition hover:border-fuchsia-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-700 disabled:text-slate-300"
                        >
                          {canRedeem ? "Redeem Now" : "Not Enough Coins"}
                        </button>
                      </div>
                    </motion.article>
                  );
                  })}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div
                className="rounded-2xl border border-violet-300/20 bg-slate-950/35 p-10 text-center text-slate-300"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.14 : 0.24, ease: rewardsEase }}
              >
                No rewards are available in this category yet.
              </motion.div>
            )}
          </motion.section>
        </div>

        <section className="rewards-benefits-section mt-6 hidden gap-px overflow-hidden rounded-2xl border border-violet-300/20 bg-violet-300/15 md:grid-cols-3 xl:grid">
          {[
            {
              icon: ShieldCheck,
              title: "Secure & Protected",
              copy: "Transactions are encrypted and fully protected",
            },
            {
              icon: Zap,
              title: "Fast Redemption",
              copy: "Processed within 5-30 minutes",
            },
            {
              icon: Headphones,
              title: "24/7 Support",
              copy: "Our support team is always ready to help",
            },
          ].map((benefit) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                className="rewards-benefit-item flex items-center gap-3 bg-slate-950/65 px-4 py-4"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: shouldReduceMotion ? 0.14 : 0.28,
                  ease: rewardsEase,
                }}
              >
                <Icon className="rewards-benefit-item__icon h-7 w-7 text-violet-300" />
                <span>
                  <strong className="block text-sm text-white">
                    {benefit.title}
                  </strong>
                  <small className="mt-1 block text-xs text-slate-300">
                    {benefit.copy}
                  </small>
                </span>
              </motion.div>
            );
          })}
        </section>
      </div>

      <AnimatePresence mode="wait">
      {modal?.kind === "confirm" && (
        <Modal key="confirm-redemption" title="Confirm Redemption" onClose={() => setModal(null)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Confirm Redemption</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Redeem{" "}
                <strong className="text-white">{modal.reward.name}</strong> for{" "}
                <strong className="text-amber-300">
                  {formatCoins(modal.reward.price)} Special Coins
                </strong>
                ?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close confirmation"
              className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            Demo only: confirmation does not create a wallet transaction. A
            backend redemption endpoint must validate the balance and
            fulfilment.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="h-10 rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                setModal({ kind: "success", reward: modal.reward })
              }
              className="h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-sm font-black text-white hover:brightness-110"
            >
              Confirm Redemption
            </button>
          </div>
        </Modal>
      )}

      {modal?.kind === "success" && (
        <Modal key="redemption-success" title="Redemption Successful" onClose={() => setModal(null)}>
          <button
            type="button"
            onClick={() => setModal(null)}
            aria-label="Close success message"
            className="float-right rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.14 : 0.3, ease: rewardsEase }}
          >
            <CheckCircle2 className="h-12 w-12 text-emerald-300 drop-shadow-[0_0_16px_rgba(110,231,183,0.35)]" />
          </motion.div>
          <h2 className="mt-4 text-xl font-black">Redemption Successful</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Your request for{" "}
            <strong className="text-white">{modal.reward.name}</strong> has been
            submitted. This demo does not change your wallet balance.
          </p>
          <button
            type="button"
            onClick={() => setModal(null)}
            className="mt-5 h-10 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-black text-white"
          >
            Done
          </button>
        </Modal>
      )}

      {modal?.kind === "history" && (
        <Modal key="redemption-history" title="Redemption History" onClose={() => setModal(null)}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Redemption History</h2>
            <button
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close redemption history"
              className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="mt-4">
            {demoRedemptionHistory.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            Demo history only. Fulfilment data will be supplied by the rewards
            service.
          </p>
        </Modal>
      )}

      {modal?.kind === "guide" && (
        <Modal key="reward-guide" title="Reward Redemption Guide" onClose={() => setModal(null)}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Reward Redemption Guide</h2>
            <button
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close reward guide"
              className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>
              <strong className="text-white">1. Choose a reward.</strong> Review
              its Special Coin cost and availability.
            </li>
            <li>
              <strong className="text-white">2. Confirm your request.</strong>{" "}
              The production service validates balance and inventory before
              redemption.
            </li>
            <li>
              <strong className="text-white">3. Track fulfilment.</strong>{" "}
              Digital rewards are usually processed within 5–30 minutes.
            </li>
          </ol>
        </Modal>
      )}
      </AnimatePresence>
    </motion.main>
  );
};

export default RewardRedemptionPage;
