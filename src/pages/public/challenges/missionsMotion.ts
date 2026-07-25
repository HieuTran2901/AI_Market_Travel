import type { Variants } from "framer-motion";

export const missionsEase = [0.22, 1, 0.36, 1] as const;
export const missionsExitEase = [0.4, 0, 1, 1] as const;

export const createMissionsMotion = (reduceMotion: boolean) => {
  const fade = (duration = 0.14): Variants => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration } },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  });

  if (reduceMotion) {
    return {
      page: fade(),
      section: fade(),
      heroArt: fade(),
      list: fade(),
      row: fade(),
      checkInList: fade(),
      checkInItem: fade(),
      sidebar: fade(),
      vip: fade(),
      modal: fade(),
      backdrop: fade(0.12),
      notice: fade(),
    };
  }

  const section: Variants = {
    hidden: { opacity: 0, y: 9 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: missionsEase },
    },
  };

  return {
    page: {
      hidden: { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.46,
          ease: missionsEase,
          when: "beforeChildren",
          staggerChildren: 0.055,
        },
      },
    } satisfies Variants,
    section,
    heroArt: {
      hidden: { opacity: 0, scale: 0.92, y: 10, rotate: -3 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        rotate: 0,
        transition: { duration: 0.42, ease: missionsEase },
      },
    } satisfies Variants,
    list: {
      hidden: {},
      visible: {
        transition: { staggerChildren: 0.045, delayChildren: 0.035 },
      },
      exit: {
        opacity: 0,
        transition: { duration: 0.15, ease: missionsExitEase },
      },
    } satisfies Variants,
    row: {
      hidden: { opacity: 0, y: 12, scale: 0.99 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.32, ease: missionsEase },
      },
      exit: {
        opacity: 0,
        y: -6,
        transition: { duration: 0.16, ease: missionsExitEase },
      },
    } satisfies Variants,
    checkInList: {
      hidden: {},
      visible: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
    } satisfies Variants,
    checkInItem: {
      hidden: { opacity: 0, y: 8, scale: 0.97 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.28, ease: missionsEase },
      },
    } satisfies Variants,
    sidebar: {
      hidden: { opacity: 0, x: 10 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.34, ease: missionsEase },
      },
    } satisfies Variants,
    vip: {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.36, ease: missionsEase },
      },
    } satisfies Variants,
    modal: {
      hidden: { opacity: 0, y: 14, scale: 0.98 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.26, ease: missionsEase },
      },
      exit: {
        opacity: 0,
        y: 8,
        scale: 0.99,
        transition: { duration: 0.16, ease: missionsExitEase },
      },
    } satisfies Variants,
    backdrop: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.14 } },
    } satisfies Variants,
    notice: {
      hidden: { opacity: 0, y: 8, scale: 0.985 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.22, ease: missionsEase },
      },
      exit: { opacity: 0, y: 5, transition: { duration: 0.14 } },
    } satisfies Variants,
  };
};
