export const paymentHistoryEase = [0.22, 1, 0.36, 1] as const;
export const paymentHistoryExitEase = [0.4, 0, 1, 1] as const;

export const pageVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.44,
      ease: paymentHistoryEase,
      when: "beforeChildren",
      staggerChildren: 0.055,
    },
  },
};

export const summaryVariants = {
  hidden: {
    opacity: 0,
    x: -14,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: paymentHistoryEase,
    },
  },
};

export const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.035,
    },
  },
};

export const rowVariants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.992,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: paymentHistoryEase,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.16,
      ease: paymentHistoryExitEase,
    },
  },
};

export const backdropVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.16,
    },
  },
};

export const modalVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.975,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.26,
      ease: paymentHistoryEase,
      when: "beforeChildren",
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.985,
    transition: {
      duration: 0.18,
      ease: paymentHistoryExitEase,
    },
  },
};

export const modalContentVariants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: paymentHistoryEase,
    },
  },
};
