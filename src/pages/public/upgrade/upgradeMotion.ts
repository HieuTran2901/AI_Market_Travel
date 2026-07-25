import type { Variants } from "framer-motion";

export const upgradeEase = [0.22, 1, 0.36, 1] as const;
export const upgradeExitEase = [0.4, 0, 1, 1] as const;

export const upgradePageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: upgradeEase,
      when: "beforeChildren",
      staggerChildren: 0.045,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: upgradeExitEase },
  },
};

export const upgradeSectionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: upgradeEase },
  },
};

export const upgradeCardContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.05, staggerChildren: 0.045 },
  },
};

export const upgradeCardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.36, ease: upgradeEase },
  },
};

