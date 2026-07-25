import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import CoinPakage from "../../../assets/images/01-starter-pack.png";

export type MembershipCoinTab = "membership" | "coins";

type MembershipCoinSwitcherProps = {
  activeTab: MembershipCoinTab;
  className?: string;
  visualTab?: MembershipCoinTab;
  isTransitioning?: boolean;
  onTabSelect?: (tab: MembershipCoinTab) => void;
  debugState?: {
    pathname: string;
    routeMode: MembershipCoinTab;
    displayedMode: MembershipCoinTab;
    targetMode: MembershipCoinTab | null;
    visualMode: MembershipCoinTab;
    phase: string;
  };
};

const tabs = [
  {
    id: "membership",
    to: "/membership",
    title: "Membership",
  },
  {
    id: "coins",
    to: "/ai-coins",
    title: "Coin Packs",
  },
] satisfies Array<{
  id: MembershipCoinTab;
  to: string;
  title: string;
}>;

export const MembershipCoinSwitcher: React.FC<MembershipCoinSwitcherProps> = ({
  activeTab,
  className,
  visualTab,
  isTransitioning = false,
  onTabSelect,
  debugState,
}) => {
  const displayedTab = visualTab ?? activeTab;

  return (
    <nav
      className={cn("flex justify-center lg:justify-end", className)}
      aria-label="Membership and AI Coins packages"
    >
      <div className="w-full max-w-[430px]">
        <div className="relative grid min-h-[52px] grid-cols-2 items-stretch overflow-hidden rounded-full border border-slate-400/24 bg-[linear-gradient(135deg,rgba(8,18,48,0.98),rgba(15,20,52,0.98))] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_28px_rgba(2,6,23,0.22)]">
          {tabs.map((tab) => {
          const isActive = displayedTab === tab.id;
          const isMembership = tab.id === "membership";

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "page" : undefined}
              aria-disabled={isTransitioning && activeTab !== tab.id}
              onClick={(event) => {
                event.preventDefault();
                if (import.meta.env.DEV) {
                  console.debug("[UpgradeSwitcher] tab clicked", {
                    clickedMode: tab.id,
                    ...debugState,
                  });
                }
                onTabSelect?.(tab.id);
              }}
              className={cn(
                "group relative z-10 grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-full border-0 bg-transparent px-3 py-2 text-left no-underline transition-colors duration-200 pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-blue-300 sm:px-4",
                isActive
                  ? isMembership
                    ? "text-violet-100"
                    : "text-amber-100"
                  : "text-slate-300 hover:text-white",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="upgrade-mode-active"
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-0 z-0 rounded-full",
                    isMembership
                      ? "bg-[linear-gradient(135deg,rgba(50,33,105,0.94),rgba(18,38,78,0.96))] shadow-[0_0_22px_rgba(124,58,237,0.24),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/70"
                      : "bg-[linear-gradient(135deg,rgba(84,44,12,0.92),rgba(51,28,33,0.96))] shadow-[0_0_22px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-amber-300/80",
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 36,
                  }}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  isActive && isMembership
                    ? "bg-violet-400/14 text-violet-200 ring-1 ring-violet-300/34"
                    : isActive
                      ? "bg-amber-400/16 text-amber-200 ring-1 ring-amber-300/40"
                      : isMembership
                        ? "bg-violet-400/8 text-violet-300 ring-1 ring-violet-300/12"
                        : "bg-amber-400/8 text-amber-300 ring-1 ring-amber-300/12",
                )}
              >
                {/* <Icon className="h-5 w-5" /> */}
                <img src={CoinPakage} alt="Coin Package" className="h-5 w-5" />
              </span>
              <span className="relative z-10 min-w-0">
                <strong
                  className={cn(
                    "block truncate text-sm font-black leading-tight",
                    isActive && isMembership
                      ? "text-violet-200"
                      : isActive
                        ? "text-amber-100"
                        : "text-slate-100",
                  )}
                >
                  {tab.title}
                </strong>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </nav>
  );
};
