import React from "react";
import { cn } from "@/lib/utils";
import {
  MembershipCoinSwitcher,
  MembershipCoinTab,
} from "./MembershipCoinSwitcher";

type MembershipCoinTopLayoutProps = {
  activeTab: MembershipCoinTab;
  left: React.ReactNode;
  controls?: React.ReactNode;
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

export const MembershipCoinTopLayout: React.FC<MembershipCoinTopLayoutProps> = ({
  activeTab,
  left,
  controls,
  className,
  visualTab,
  isTransitioning,
  onTabSelect,
  debugState,
}) => (
  <section
    className={cn(
      "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-8",
      className,
    )}
  >
    <div className="min-w-0 self-start">{left}</div>

    <div className="w-full max-w-none self-start lg:max-w-[430px] lg:justify-self-end">
      <MembershipCoinSwitcher
        activeTab={activeTab}
        visualTab={visualTab}
        isTransitioning={isTransitioning}
        onTabSelect={onTabSelect}
        debugState={debugState}
        className="w-full"
      />
      {controls ? <div className="mt-3 w-full">{controls}</div> : null}
    </div>
  </section>
);
