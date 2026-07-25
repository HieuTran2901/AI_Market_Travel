import React from "react";
import { motion } from "framer-motion";
import { MembershipCoinTopLayout } from "../ai-coins/MembershipCoinTopLayout";
import {
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
  const isMembership = transition.displayedMode === "membership";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(50,65,150,0.14),transparent_38%),linear-gradient(180deg,#020817_0%,#031127_55%,#020817_100%)] text-white">
      <UpgradeThemeGlow mode={transition.visualMode} phase={transition.phase} />

      <div className="relative z-10 mx-auto w-[min(calc(100%_-_40px),1720px)] pb-8 pt-5 [@media(max-height:820px)]:pb-6 [@media(max-height:820px)]:pt-4">
        <motion.div {...transition.pageMotionProps}>
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
            left={isMembership ? <MembershipIntro /> : <AiCoinsHeroTitle />}
            controls={
              isMembership ? (
                <MembershipBillingControls
                  billingCycle={billingCycle}
                  setBillingCycle={setBillingCycle}
                />
              ) : null
            }
          />

          {transition.displayedMode === "membership" ? (
            <MembershipUpgradeContent
              transition={transition}
              billingCycle={billingCycle}
            />
          ) : (
            <AiCoinsUpgradeContent transition={transition} showBenefits />
          )}
        </motion.div>
      </div>
    </main>
  );
};
