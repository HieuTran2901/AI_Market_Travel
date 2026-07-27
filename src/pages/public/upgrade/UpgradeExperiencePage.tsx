import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MembershipCoinTopLayout } from "../ai-coins/MembershipCoinTopLayout";
import {
  AiCoinsMobileExperience,
  AiCoinsHeroTitle,
  AiCoinsUpgradeContent,
} from "../ai-coins/AiCoinsPage";
import {
  BillingCycle,
  MembershipBillingControls,
  MembershipIntro,
  MembershipUpgradeContent,
} from "../membership/MembershipPackagesPage";
import {
  UpgradeThemeGlow,
  useUpgradeModeTransition,
} from "../ai-coins/useUpgradeModeTransition";

export const UpgradeExperiencePage: React.FC = () => {
  const transition = useUpgradeModeTransition();
  const [billingCycle, setBillingCycle] =
    React.useState<BillingCycle>("yearly");

  return (
    <main className="relative min-h-dvh w-full min-w-0 overflow-x-clip bg-[radial-gradient(circle_at_50%_0%,rgba(50,65,150,0.14),transparent_38%),linear-gradient(180deg,#020817_0%,#031127_55%,#020817_100%)] text-white">
      <UpgradeThemeGlow mode={transition.visualMode} phase={transition.phase} />

      <div
        className={cn(
          "relative z-10 pb-8 pt-5 [@media(max-height:820px)]:pb-6 [@media(max-height:820px)]:pt-4",
          transition.displayedMode === "coins"
            ? "w-full min-w-0 max-w-none overflow-x-clip px-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] sm:px-6 lg:mx-auto lg:w-[min(calc(100%_-_40px),1720px)] lg:px-0"
            : "mx-auto w-[min(calc(100%_-_40px),1720px)]",
        )}
      >
        <motion.div {...transition.pageMotionProps}>
          {transition.displayedMode === "membership" ? (
            <>
              <MembershipCoinTopLayout
                activeTab={transition.routeMode}
                visualTab={transition.visualMode}
                isTransitioning={transition.isTransitioning}
                onTabSelect={transition.switchMode}
                debugState={{
                  pathname: transition.pathname,
                  routeMode: transition.routeMode,
                  displayedMode: transition.displayedMode,
                  targetMode: transition.targetMode,
                  visualMode: transition.visualMode,
                  phase: transition.phase,
                }}
                left={<MembershipIntro />}
                controls={
                  <MembershipBillingControls
                    billingCycle={billingCycle}
                    setBillingCycle={setBillingCycle}
                  />
                }
              />
              <MembershipUpgradeContent
                transition={transition}
                billingCycle={billingCycle}
              />
            </>
          ) : (
            <>
              <div className="lg:hidden">
                <AiCoinsMobileExperience transition={transition} />
              </div>
              <div className="hidden lg:block">
                <MembershipCoinTopLayout
                  activeTab={transition.routeMode}
                  visualTab={transition.visualMode}
                  isTransitioning={transition.isTransitioning}
                  onTabSelect={transition.switchMode}
                  debugState={{
                    pathname: transition.pathname,
                    routeMode: transition.routeMode,
                    displayedMode: transition.displayedMode,
                    targetMode: transition.targetMode,
                    visualMode: transition.visualMode,
                    phase: transition.phase,
                  }}
                  left={<AiCoinsHeroTitle />}
                />
                <AiCoinsUpgradeContent transition={transition} showBenefits />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
};
