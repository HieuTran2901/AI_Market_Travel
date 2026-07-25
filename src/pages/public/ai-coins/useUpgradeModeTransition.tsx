import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MotionProps,
  TargetAndTransition,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { MembershipCoinTab } from "./MembershipCoinSwitcher";
import {
  upgradeCardContainerVariants,
  upgradeCardVariants,
  upgradeEase,
  upgradeExitEase,
} from "../upgrade/upgradeMotion";

export type TransitionPhase = "idle" | "exiting" | "crossing" | "entering";

export const MEMBERSHIP_ROUTE = "/membership";
export const COIN_PACKS_ROUTE = "/ai-coins";

const pathByMode: Record<MembershipCoinTab, string> = {
  membership: MEMBERSHIP_ROUTE,
  coins: COIN_PACKS_ROUTE,
};

export const getUpgradeModeFromPath = (pathname: string): MembershipCoinTab => {
  if (
    pathname === MEMBERSHIP_ROUTE ||
    pathname.startsWith(`${MEMBERSHIP_ROUTE}/`)
  ) {
    return "membership";
  }

  if (
    pathname === COIN_PACKS_ROUTE ||
    pathname.startsWith(`${COIN_PACKS_ROUTE}/`)
  ) {
    return "coins";
  }

  // Fallback khi hook được gọi ngoài hai route chính.
  return "membership";
};

export const cardContainerVariants = upgradeCardContainerVariants;
export const cardItemVariants = upgradeCardVariants;

type SwitchOptions = {
  updateRouteAfter?: boolean;
};

export type UpgradeModeTransition = {
  pathname: string;
  routeMode: MembershipCoinTab;
  displayedMode: MembershipCoinTab;
  targetMode: MembershipCoinTab | null;
  visualMode: MembershipCoinTab;
  phase: TransitionPhase;
  controls: ReturnType<typeof useAnimationControls>;
  isTransitioning: boolean;
  revealCards: boolean;
  featuredPulse: boolean;

  switchMode: (mode: MembershipCoinTab, options?: SwitchOptions) => void;

  pageMotionProps: MotionProps;
};

const incomingState = (
  reducedMotion: boolean,
): TargetAndTransition => ({
  opacity: 0,

  y: reducedMotion ? 0 : 12,
});

const settledState: TargetAndTransition = {
  opacity: 1,
  y: 0,
};

export const useUpgradeModeTransition = (): UpgradeModeTransition => {
  const location = useLocation();
  const navigate = useNavigate();

  const reducedMotion = useReducedMotion();
  const controls = useAnimationControls();

  const routeMode = getUpgradeModeFromPath(location.pathname);

  const mountedRef = React.useRef(false);
  const hasSyncedInitialRouteRef = React.useRef(false);

  const phaseRef = React.useRef<TransitionPhase>("idle");

  const pathnameRef = React.useRef(location.pathname);

  const displayedModeRef = React.useRef<MembershipCoinTab>(routeMode);
  const targetModeRef = React.useRef<MembershipCoinTab | null>(null);

  const [displayedMode, setDisplayedMode] =
    React.useState<MembershipCoinTab>(routeMode);

  const [targetMode, setTargetMode] = React.useState<MembershipCoinTab | null>(
    null,
  );

  const [phase, setPhaseState] = React.useState<TransitionPhase>("idle");

  const setPhase = React.useCallback((nextPhase: TransitionPhase) => {
    phaseRef.current = nextPhase;
    setPhaseState(nextPhase);
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    controls.start({
      ...settledState,
      transition: reducedMotion
        ? { duration: 0.14, ease: "linear" }
        : { duration: 0.32, ease: upgradeEase },
    });

    return () => {
      mountedRef.current = false;
      controls.stop();
    };
  }, [controls, reducedMotion]);

  React.useEffect(() => {
    pathnameRef.current = location.pathname;

    if (!hasSyncedInitialRouteRef.current) {
      hasSyncedInitialRouteRef.current = true;
      return;
    }

    if (
      phaseRef.current !== "idle" &&
      targetModeRef.current === routeMode
    ) {
      return;
    }

    displayedModeRef.current = routeMode;
    targetModeRef.current = null;
    phaseRef.current = "idle";

    setDisplayedMode(routeMode);
    setTargetMode(null);
    setPhaseState("idle");

    controls.set(settledState);

    if (import.meta.env.DEV) {
      console.debug("[UpgradeTransition] route synchronized", {
        pathname: location.pathname,
        routeMode,
      });
    }
  }, [location.pathname, routeMode, controls]);

  React.useEffect(() => {
    displayedModeRef.current = displayedMode;
  }, [displayedMode]);

  const switchMode = React.useCallback(
    async (
      nextMode: MembershipCoinTab,
      { updateRouteAfter = true }: SwitchOptions = {},
    ) => {
      const currentPathname = pathnameRef.current;

      const currentRouteMode = getUpgradeModeFromPath(currentPathname);

      if (nextMode === currentRouteMode) {
        if (import.meta.env.DEV) {
          console.debug("[UpgradeTransition] already on route", {
            nextMode,
            pathname: currentPathname,
            routeMode: currentRouteMode,
            displayedMode: displayedModeRef.current,
            phase: phaseRef.current,
          });
        }

        return;
      }

      if (phaseRef.current !== "idle") {
        if (import.meta.env.DEV) {
          console.debug("[UpgradeTransition] transition busy", {
            nextMode,
            pathname: currentPathname,
            routeMode: currentRouteMode,
            displayedMode: displayedModeRef.current,
            phase: phaseRef.current,
          });
        }

        return;
      }

      const destination = pathByMode[nextMode];

      targetModeRef.current = nextMode;
      setTargetMode(nextMode);
      setPhase("exiting");

      if (import.meta.env.DEV) {
        console.debug("[UpgradeTransition] exit-start", {
          nextMode,
          destination,
          pathname: currentPathname,
          routeMode: currentRouteMode,
          displayedMode: displayedModeRef.current,
        });
      }

      try {
        const exitState: TargetAndTransition = {
          opacity: 0,

          y: reducedMotion ? 0 : nextMode === "coins" ? -10 : 10,

          transition: reducedMotion
            ? {
                duration: 0.14,
                ease: "linear",
              }
            : {
                duration: 0.24,
                ease: upgradeExitEase,
              },
        };

        await controls.start(exitState);

        if (!mountedRef.current) {
          return;
        }

        setPhase("crossing");

        setDisplayedMode(nextMode);
        displayedModeRef.current = nextMode;

        controls.set(incomingState(Boolean(reducedMotion)));
        setPhase("entering");

        if (import.meta.env.DEV) {
          console.debug("[UpgradeTransition] content-swap", {
            nextMode,
            destination,
            pathname: pathnameRef.current,
          });
        }

        if (updateRouteAfter && pathnameRef.current !== destination) {
          if (import.meta.env.DEV) {
            console.debug("[UpgradeTransition] route-sync", {
              destination,
              pathname: pathnameRef.current,
            });
          }

          pathnameRef.current = destination;
          navigate(destination);
        }

        /**
         * Trường hợp không cần cập nhật route:
         * chạy animation hiện nội dung mới.
         */
        if (import.meta.env.DEV) {
          console.debug("[UpgradeTransition] enter-start", {
            displayedMode: nextMode,
            pathname: pathnameRef.current,
          });
        }

        await controls.start({
          ...settledState,

          transition: reducedMotion
            ? {
                duration: 0.14,
                ease: "linear",
              }
            : {
                duration: 0.36,
                ease: upgradeEase,
              },
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[UpgradeTransition] transition failed", error);
        }
      } finally {
        phaseRef.current = "idle";
        targetModeRef.current = null;

        if (mountedRef.current) {
          setTargetMode(null);
          setPhaseState("idle");

          controls.set(settledState);

          if (import.meta.env.DEV) {
            console.debug("[UpgradeTransition] transition-idle", {
              pathname: pathnameRef.current,
              displayedMode: displayedModeRef.current,
            });
          }
        }
      }
    },
    [controls, navigate, reducedMotion, setPhase],
  );

  const visualMode = targetMode ?? displayedMode;

  return {
    pathname: location.pathname,
    routeMode,
    displayedMode,
    targetMode,
    visualMode,
    phase,
    controls,

    isTransitioning: phase !== "idle",

    revealCards: phase === "entering" && !Boolean(reducedMotion),

    featuredPulse: phase === "entering" && !Boolean(reducedMotion),

    switchMode,

    pageMotionProps: {
      initial: incomingState(Boolean(reducedMotion)),
      animate: controls,
    },
  };
};

export const UpgradeThemeGlow = ({
  mode,
  phase,
}: {
  mode: MembershipCoinTab;
  phase: TransitionPhase;
}) => {
  const isCoins = mode === "coins";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[opacity,background] duration-500 motion-reduce:transition-opacity"
        style={{
          opacity: phase === "idle" ? 0.72 : 0.96,

          background: isCoins
            ? [
                "radial-gradient(",
                "circle at 56% 18%,",
                "rgba(245, 158, 11, 0.15),",
                "transparent 38%",
                "),",
                "radial-gradient(",
                "circle at 80% 35%,",
                "rgba(249, 115, 22, 0.07),",
                "transparent 32%",
                ")",
              ].join(" ")
            : [
                "radial-gradient(",
                "circle at 52% 18%,",
                "rgba(139, 92, 246, 0.16),",
                "transparent 40%",
                "),",
                "radial-gradient(",
                "circle at 78% 34%,",
                "rgba(34, 211, 238, 0.07),",
                "transparent 34%",
                ")",
              ].join(" "),
        }}
      />
    </div>
  );
};
