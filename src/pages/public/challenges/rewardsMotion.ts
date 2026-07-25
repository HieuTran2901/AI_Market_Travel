import type { Variants } from "framer-motion";

export const rewardsEase = [0.22, 1, 0.36, 1] as const;
export const rewardsExitEase = [0.4, 0, 1, 1] as const;

export const rewardsPageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.28, ease: rewardsEase },
  },
};

export const rewardsHeroVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: rewardsEase },
  },
};

export const rewardsSidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: rewardsEase },
  },
};

export const rewardsGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: rewardsExitEase },
  },
};

export const rewardsCardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.36, ease: rewardsEase },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.985,
    transition: { duration: 0.18, ease: rewardsExitEase },
  },
};

export const rewardsModalVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.26, ease: rewardsEase },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.99,
    transition: { duration: 0.16, ease: rewardsExitEase },
  },
};
