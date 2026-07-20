import React from "react";
import { NavLink } from "react-router-dom";
import { Coins, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import CoinPakage from "../../../assets/images/01-starter-pack.png";

export type MembershipCoinTab = "membership" | "coins";

type MembershipCoinSwitcherProps = {
  activeTab: MembershipCoinTab;
  className?: string;
};

const tabs = [
  {
    id: "membership",
    to: "/membership",
    title: "Membership",
    icon: Crown,
  },
  {
    id: "coins",
    to: "/ai-coins",
    title: "Coin Packs",
    icon: Coins,
  },
] satisfies Array<{
  id: MembershipCoinTab;
  to: string;
  title: string;
  icon: React.ElementType;
}>;

export const MembershipCoinSwitcher: React.FC<MembershipCoinSwitcherProps> = ({
  activeTab,
  className,
}) => (
  <nav
    className={cn("flex justify-center lg:justify-end", className)}
    aria-label="Membership and AI Coins packages"
  >
    <div className="w-full max-w-[430px]">
      <div className="relative grid min-h-[52px] grid-cols-2 items-stretch overflow-hidden rounded-full border border-slate-400/24 bg-[linear-gradient(135deg,rgba(8,18,48,0.98),rgba(15,20,52,0.98))] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_28px_rgba(2,6,23,0.22)]">
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none",
            activeTab === "membership"
              ? "translate-x-1 bg-[linear-gradient(135deg,rgba(48,31,93,0.82),rgba(27,25,63,0.92))] shadow-[0_0_18px_rgba(124,58,237,0.20),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/58"
              : "translate-x-[calc(100%+4px)] bg-[linear-gradient(135deg,rgba(45,36,95,0.82),rgba(28,29,72,0.92))] shadow-[0_0_18px_rgba(99,102,241,0.20),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-blue-400/48",
          )}
        />
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isMembership = tab.id === "membership";
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative z-10 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-full px-3 py-2 text-left no-underline transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-blue-300 sm:px-4",
                isActive
                  ? isMembership
                    ? "text-violet-100"
                    : "text-blue-100"
                  : "text-slate-300 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  isActive && isMembership
                    ? "bg-violet-400/14 text-violet-200 ring-1 ring-violet-300/34"
                    : isActive
                      ? "bg-blue-400/14 text-blue-200 ring-1 ring-blue-300/34"
                      : isMembership
                        ? "bg-violet-400/8 text-violet-300 ring-1 ring-violet-300/12"
                        : "bg-blue-400/8 text-blue-300 ring-1 ring-blue-300/12",
                )}
              >
                {/* <Icon className="h-5 w-5" /> */}
                <img src={CoinPakage} alt="Coin Package" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <strong
                  className={cn(
                    "block truncate text-sm font-black leading-tight",
                    isActive && isMembership
                      ? "text-violet-200"
                      : isActive
                        ? "text-blue-100"
                        : "text-slate-100",
                  )}
                >
                  {tab.title}
                </strong>
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  </nav>
);
