import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  Headphones,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import bannedAccountIllustration from "@/assets/auth/banned-account-boy.png";

type AuthMode = "login" | "register";
type TransitionPhase = "idle" | "expanding" | "cinematic" | "revealing";

type AuthPageProps = {
  initialMode: AuthMode;
};

type AuthApiError = {
  errorCode?: string;
  message?: string;
  status?: number;
  details?: {
    email?: unknown;
    reasonCode?: unknown;
    reasonLabel?: unknown;
    reason?: unknown;
    bannedAt?: unknown;
    bannedByDisplayName?: unknown;
  };
};

type BannedAccountDialogState = {
  open: boolean;
  message: string;
  email: string;
  reason: string;
  reasonCode?: string;
  reasonLabel?: string;
  bannedAt?: string;
  bannedByDisplayName?: string;
};

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine(Boolean, {
      message: "You must agree before creating an account",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const smoothEase = [0.22, 1, 0.36, 1] as const;
const cinematicEase = [0.76, 0, 0.24, 1] as const;
const panelTransition = {
  duration: 1.1,
  ease: cinematicEase,
};

const getAuthErrorMessage = (error: AuthApiError, fallback: string) => {
  switch (error.errorCode) {
    case "INVALID_CREDENTIALS":
      return "Email or password is incorrect.";
    case "ACCOUNT_LOCKED":
      return error.message || "Your account is temporarily locked.";
    case "ACCOUNT_INACTIVE":
      return (
        error.message ||
        "Your account is currently inactive. Please contact support for assistance."
      );
    case "ACCOUNT_EXPIRED":
      return error.message || "Your account has expired.";
    case "CREDENTIALS_EXPIRED":
      return error.message || "Your credentials have expired.";
    default:
      return error.message || fallback;
  }
};

const getStringDetail = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const fallbackBanReason =
  "Your account was restricted for violating platform policies.";

const BAN_REASON_LABELS: Record<string, string> = {
  SPAM_ABUSE: "Spam or abuse",
  FRAUD_SUSPICIOUS_ACTIVITY: "Fraud or suspicious activity",
  POLICY_VIOLATION: "Policy violation",
  PAYMENT_ABUSE: "Payment abuse",
  SECURITY_RISK: "Security risk",
  DUPLICATE_ACCOUNT: "Duplicate account",
  OTHER: "Other",
};

const getBanReasonLabel = (reasonCode?: string, reasonLabel?: string) => {
  if (reasonLabel?.trim()) return reasonLabel.trim();
  if (reasonCode && BAN_REASON_LABELS[reasonCode])
    return BAN_REASON_LABELS[reasonCode];
  return "Account restriction";
};

const formatBannedDate = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
    scale: 0.985,
    filter: "blur(6px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: smoothEase },
  },
  curtainExit: (direction: number) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
    scale: 0.985,
    filter: "blur(5px)",
    transition: { duration: 0.24, ease: cinematicEase },
  }),
  exit: (direction: number) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
    scale: 0.985,
    filter: "blur(5px)",
    transition: { duration: 0.26, ease: cinematicEase },
  }),
};

const mobileFormVariants: Variants = {
  enter: {
    opacity: 0,
    x: 0,
    y: 8,
    scale: 1,
    rotate: 0,
    filter: "none",
  },
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    filter: "none",
    transition: { duration: 0.2, ease: smoothEase },
  },
  curtainExit: {
    opacity: 0,
    x: 0,
    y: -4,
    scale: 1,
    rotate: 0,
    filter: "none",
    transition: { duration: 0.12, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: 0,
    y: -4,
    scale: 1,
    rotate: 0,
    filter: "none",
    transition: { duration: 0.12, ease: "easeOut" },
  },
};

const fieldContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.08,
    },
  },
};

const fieldItem: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.34, ease: smoothEase },
  },
};

const brandFeatures = [
  {
    icon: Sparkles,
    title: "AI-Powered Recommendations",
    description: "Personalized suggestions just for you",
    className: "from-violet-500 to-blue-500",
  },
  {
    icon: CalendarCheck,
    title: "All-in-One Booking",
    description: "Stays, tours, experiences & more",
    className: "from-blue-600 to-cyan-500",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Trusted",
    description: "Secure payments and trusted partners",
    className: "from-emerald-500 to-teal-500",
  },
];

const brandScenes: Record<
  AuthMode,
  {
    image: string;
    eyebrow: string;
    title: React.ReactNode;
    description: React.ReactNode;
    proofTitle: string;
    proofSubtitle: string;
    overlay: string;
  }
> = {
  login: {
    image:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=85",
    eyebrow: "Welcome back",
    title: (
      <>
        Welcome back,
        <br />
        travel smarter
        <br />
        <span className="font-serif italic text-blue-200 drop-shadow-[0_0_16px_rgba(147,197,253,0.85)]">
          with AI
        </span>
      </>
    ),
    description: (
      <>
        Continue your journey and let AI help
        <br />
        you plan smarter, book easier, and explore more.
      </>
    ),
    proofTitle: "Trusted by 200K+ travelers",
    proofSubtitle: "Real travelers. Real trips. Real experiences.",
    overlay:
      "linear-gradient(135deg, rgba(2,6,23,.80), rgba(30,58,138,.48), rgba(234,88,12,.10))",
  },
  register: {
    image:
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=1600&q=85",
    eyebrow: "Start exploring",
    title: (
      <>
        Start your next
        <br />
        adventure{" "}
        <span className="font-serif italic text-violet-200 drop-shadow-[0_0_16px_rgba(196,181,253,0.85)]">
          with AI
        </span>
      </>
    ),
    description: (
      <>
        Create your account today and unlock
        <br />
        smarter travel, tailored to you.
      </>
    ),
    proofTitle: "Join 200K+ travelers",
    proofSubtitle: "finding unforgettable experiences",
    overlay:
      "linear-gradient(135deg, rgba(2,6,23,.70), rgba(49,46,129,.50), rgba(14,165,233,.12))",
  },
};

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
};

type AuthPresentationMode = "mobile" | "tablet" | "desktop" | "reduced";

type AuthPresentation = {
  mode: AuthPresentationMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  shouldReduceMotion: boolean;
};

const useAuthPresentationMode = (): AuthPresentation => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery(
    "(min-width: 768px) and (max-width: 1023px)",
  );
  const prefersReduced = useReducedMotion();

  return {
    mode: prefersReduced
      ? "reduced"
      : isMobile
        ? "mobile"
        : isTablet
          ? "tablet"
          : "desktop",
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    shouldReduceMotion: Boolean(prefersReduced),
  };
};

const usePointerParallax = (enabled: boolean) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setPosition({ x: 0, y: 0 });
      return;
    }

    let frame = 0;
    const handlePointerMove = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        setPosition({
          x: Math.max(-1, Math.min(1, x)),
          y: Math.max(-1, Math.min(1, y)),
        });
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [enabled]);

  return position;
};

const AuthBrandPanel = ({
  mode,
  layoutMode,
  transitionPhase,
  isDesktop,
  isTransitioning,
  direction,
}: {
  mode: AuthMode;
  layoutMode: AuthMode;
  transitionPhase: TransitionPhase;
  isDesktop: boolean;
  isTransitioning: boolean;
  direction: 1 | -1;
}) => {
  const prefersReduced = useReducedMotion();
  const isRegisterLayout = layoutMode === "register";
  const scene = brandScenes[mode];
  const ambientEnabled = isDesktop && !prefersReduced && !isTransitioning;
  const parallax = usePointerParallax(ambientEnabled);
  const isFullScene =
    transitionPhase === "expanding" || transitionPhase === "cinematic";
  const sceneLeft = isFullScene
    ? "0%"
    : isDesktop && isRegisterLayout
      ? "50%"
      : "0%";
  const sceneWidth = isFullScene ? "100%" : "50%";
  const cameraX = isTransitioning
    ? transitionPhase === "cinematic"
      ? direction > 0
        ? -70
        : 70
      : direction > 0
        ? 30
        : -30
    : isRegisterLayout
      ? -24
      : 24;
  const cameraScale =
    isTransitioning && transitionPhase === "cinematic"
      ? 1.09
      : isRegisterLayout
        ? 1.06
        : 1.04;
  const ambientBackgroundX = cameraX + parallax.x * 5;
  const ambientBackgroundY = parallax.y * 5;
  const marketingParallax = {
    x: ambientEnabled ? parallax.x * 1.5 : 0,
    y: ambientEnabled ? parallax.y * 1.5 : 0,
  };
  const featureParallax = {
    x: ambientEnabled ? parallax.x * -2.5 : 0,
    y: ambientEnabled ? parallax.y * -2.5 : 0,
  };
  const glowParallax = {
    x: ambientEnabled ? parallax.x * 6 : 0,
    y: ambientEnabled ? parallax.y * 6 : 0,
  };

  return (
    <motion.aside
      className="absolute left-0 top-0 hidden h-full w-1/2 overflow-hidden bg-slate-950 lg:block"
      initial={false}
      animate={{ left: sceneLeft, width: sceneWidth }}
      transition={prefersReduced ? { duration: 0 } : panelTransition}
      style={{
        willChange: "left, width",
        transform: "translateZ(0)",
        zIndex: isTransitioning ? 30 : 10,
      }}
    >
      {(["login", "register"] as AuthMode[]).map((sceneMode) => (
        <motion.div
          key={sceneMode}
          className="absolute -inset-x-10 inset-y-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${brandScenes[sceneMode].image}')` }}
          initial={false}
          animate={{
            opacity: mode === sceneMode ? 1 : 0,
            x: ambientEnabled
              ? [
                  ambientBackgroundX,
                  ambientBackgroundX + (mode === "register" ? -8 : 8),
                  ambientBackgroundX,
                ]
              : cameraX,
            y: ambientEnabled
              ? [ambientBackgroundY, ambientBackgroundY - 4, ambientBackgroundY]
              : 0,
            scale: ambientEnabled
              ? [cameraScale, cameraScale + 0.018, cameraScale]
              : cameraScale,
          }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : ambientEnabled
                ? {
                    duration: 18,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                  }
                : { duration: 0.7, ease: cinematicEase }
          }
          aria-hidden={mode !== sceneMode}
        />
      ))}
      <motion.div
        className="absolute inset-0"
        animate={{ background: scene.overlay }}
        transition={prefersReduced ? { duration: 0 } : panelTransition}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/64 via-transparent to-slate-950/24" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/30 via-transparent to-transparent" />
      <motion.div
        className="pointer-events-none absolute right-[18%] top-[18%] h-72 w-72 rounded-full bg-blue-400/10 blur-3xl"
        animate={
          ambientEnabled
            ? {
                x: glowParallax.x,
                y: glowParallax.y,
                opacity: [0.18, 0.28, 0.18],
              }
            : { x: 0, y: 0, opacity: 0.12 }
        }
        transition={{
          duration: 20,
          repeat: ambientEnabled ? Infinity : 0,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
      <AnimatePresence>
        {isTransitioning && (
          <motion.span
            className={`pointer-events-none absolute top-0 z-20 h-full w-[2px] ${
              direction > 0 ? "right-0" : "left-0"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(96,165,250,0.9), rgba(139,92,246,0.75), transparent)",
              boxShadow:
                "0 0 12px rgba(59,130,246,0.5), 0 0 28px rgba(139,92,246,0.25)",
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex min-h-screen flex-col justify-between px-12 py-10 font-sans text-white xl:px-16">
        <motion.img
          src="/brand/ai-marketplace-traveler-logo.png"
          alt="AI Marketplace Traveler"
          className="h-16 w-auto max-w-[230px] object-contain brightness-0 invert drop-shadow-xl"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />

        <motion.div
          className="max-w-xl"
          animate={marketingParallax}
          transition={{
            duration: ambientEnabled ? 0.45 : 0.25,
            ease: "easeOut",
          }}
          style={{ willChange: ambientEnabled ? "transform" : undefined }}
        >
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: smoothEase }}
            >
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-white/70 drop-shadow">
                {scene.eyebrow}
              </p>
              <h1 className="relative text-[52px] font-black leading-[1.08] tracking-[-0.05em] text-white drop-shadow-2xl xl:text-[62px]">
                {scene.title}
                <motion.span
                  className="absolute -right-8 top-8 hidden text-blue-100 drop-shadow-[0_0_14px_rgba(191,219,254,0.9)] xl:inline-flex"
                  animate={
                    ambientEnabled
                      ? {
                          y: [0, -5, 0],
                          rotate: [-5, 7, -5],
                          opacity: [0.55, 0.95, 0.55],
                          scale: [0.95, 1.06, 0.95],
                        }
                      : { y: 0, rotate: 0, opacity: 0.65, scale: 1 }
                  }
                  transition={{
                    duration: 4.2,
                    repeat: ambientEnabled ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="h-6 w-6" />
                </motion.span>
              </h1>
              <p className="mt-7 max-w-lg text-[20px] font-medium leading-relaxed text-white/90 drop-shadow-lg">
                {scene.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="mt-10 space-y-5"
            variants={fieldContainer}
            initial="hidden"
            animate="show"
          >
            {brandFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const floatDurations = [5.2, 6.4, 5.8];
              return (
                <motion.div
                  key={feature.title}
                  variants={fieldItem}
                  className="flex items-center gap-5"
                >
                  <motion.span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${feature.className} text-white shadow-lg shadow-slate-950/30`}
                    animate={
                      ambientEnabled
                        ? {
                            x: featureParallax.x,
                            y: [
                              featureParallax.y,
                              featureParallax.y - (index + 1) * 1.5,
                              featureParallax.y,
                            ],
                          }
                        : { x: 0, y: 0 }
                    }
                    transition={{
                      duration: floatDurations[index],
                      delay: index * 0.35,
                      repeat: ambientEnabled ? Infinity : 0,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.span>
                  <span>
                    <span className="block text-base font-bold tracking-tight text-white drop-shadow-md">
                      {feature.title}
                    </span>
                    <span className="mt-1 block text-sm font-medium leading-relaxed text-white/75 drop-shadow">
                      {feature.description}
                    </span>
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.div
          className="flex max-w-lg items-center gap-6 rounded-3xl border border-white/20 bg-slate-950/35 px-8 py-6 shadow-2xl shadow-slate-950/25 backdrop-blur-[18px]"
          initial={{ opacity: 0, y: 18 }}
          animate={
            ambientEnabled
              ? { opacity: 1, y: [0, -4, 0] }
              : { opacity: 1, y: 0 }
          }
          transition={
            ambientEnabled
              ? {
                  opacity: { duration: 0.6, delay: 0.18 },
                  y: {
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  },
                }
              : { duration: 0.6, delay: 0.18, ease: "easeOut" }
          }
        >
          <div className="flex -space-x-3">
            {["LN", "JD", "AM", "TP"].map((avatar, index) => (
              <motion.span
                key={avatar}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/75 bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-black text-white"
                style={{ zIndex: 4 - index }}
                initial={prefersReduced ? false : { scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.34,
                  delay: 0.08 + index * 0.08,
                  ease: smoothEase,
                }}
              >
                {avatar}
              </motion.span>
            ))}
          </div>
          <div>
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.45, ease: smoothEase }}
              >
                <p className="text-base font-bold tracking-tight text-white drop-shadow-md">
                  {scene.proofTitle}
                </p>
                <p className="mt-1 text-sm font-medium text-white/75 drop-shadow">
                  {scene.proofSubtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
};

const AuthMobileHero = ({ mode }: { mode: AuthMode }) => {
  const isRegisterMode = mode === "register";

  return (
    <section className="auth-mobile-hero" aria-label="AI Marketplace Traveler">
      <img
        className="auth-mobile-hero__image"
        src={brandScenes[mode].image}
        alt=""
      />
      <div className="auth-mobile-hero__topbar">
        <img
          src="/brand/ai-marketplace-traveler-logo.png"
          alt="AI Marketplace Traveler"
          className="auth-mobile-hero__logo"
        />
        <button
          type="button"
          className="auth-mobile-hero__language"
          aria-label="Language: English"
        >
          <Globe2 className="h-4 w-4" />
          English
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <p className="auth-mobile-hero__copy">
        {isRegisterMode
          ? "Your journey starts here, we'll handle the rest."
          : "Smarter journeys, unforgettable experiences."}
      </p>
    </section>
  );
};

const AuthFormPresentation = ({
  isDesktop,
  motionEnabled,
  isRegisterMode,
  children,
}: {
  isDesktop: boolean;
  motionEnabled: boolean;
  isRegisterMode: boolean;
  children: React.ReactNode;
}) => {
  const panelClassName =
    "auth-form-panel relative z-10 flex w-full flex-col items-center justify-start overflow-x-hidden overflow-y-visible bg-[#f8fafc] px-[max(16px,env(safe-area-inset-left))] pb-[calc(28px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-8 md:pt-5 lg:absolute lg:left-0 lg:top-0 lg:h-screen lg:min-h-0 lg:w-1/2 lg:justify-center lg:overflow-hidden lg:px-8 lg:py-4 xl:px-12 2xl:px-16";

  if (!isDesktop) {
    return <section className={panelClassName}>{children}</section>;
  }

  if (!motionEnabled) {
    return (
      <section
        className={panelClassName}
        style={{ left: isRegisterMode ? "0%" : "50%" }}
      >
        {children}
      </section>
    );
  }

  return (
    <motion.section
      className={panelClassName}
      initial={false}
      animate={{ left: isRegisterMode ? "0%" : "50%" }}
      transition={panelTransition}
      style={{ willChange: "left", transform: "translateZ(0)", zIndex: 10 }}
    >
      {children}
    </motion.section>
  );
};

const AuthCardPositioner = ({
  isDesktop,
  motionEnabled,
  isRegisterFormMode,
  children,
}: {
  isDesktop: boolean;
  motionEnabled: boolean;
  isRegisterFormMode: boolean;
  children: React.ReactNode;
}) => {
  const className =
    "relative mx-auto w-full max-w-[520px] md:max-w-[560px] lg:w-[88%] lg:max-w-[640px] xl:max-w-[660px] 2xl:max-w-[720px]";

  if (!isDesktop || !motionEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layout
      animate={{ y: isRegisterFormMode ? -6 : 0 }}
      transition={{ duration: 0.45, ease: smoothEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const AuthCardSurface = ({
  isDesktop,
  motionEnabled,
  ambientActive,
  children,
}: {
  isDesktop: boolean;
  motionEnabled: boolean;
  ambientActive: boolean;
  children: React.ReactNode;
}) => {
  const className =
    "auth-mobile-sheet traveler-auth-card relative overflow-visible rounded-[22px] border bg-white lg:rounded-[30px]";

  if (!isDesktop || !motionEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layout
      className={className}
      animate={
        ambientActive
          ? {
              boxShadow: [
                "0 22px 70px rgba(15,23,42,0.10)",
                "0 26px 82px rgba(37,99,235,0.12)",
                "0 22px 70px rgba(15,23,42,0.10)",
              ],
            }
          : { boxShadow: "0 22px 70px rgba(15,23,42,0.10)" }
      }
      transition={{
        duration: 8,
        repeat: ambientActive ? Infinity : 0,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  error?: string;
  compact?: boolean;
};

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      icon: Icon,
      error,
      compact = false,
      className = "",
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);

    return (
      <div>
        <motion.div
          className="group relative"
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          animate={focused ? { y: -1 } : { y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center justify-center">
            <motion.span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-slate-500"
              animate={
                focused
                  ? {
                      color: "#2563eb",
                      scale: 1.05,
                      backgroundColor: "#dbeafe",
                    }
                  : hovered
                    ? {
                        color: "#2563eb",
                        scale: 1.03,
                        backgroundColor: "#eff6ff",
                      }
                    : { color: "#64748b", scale: 1, backgroundColor: "#eff6ff" }
              }
              transition={{ duration: 0.18 }}
            >
              <Icon className="h-5 w-5" />
            </motion.span>
          </span>
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-[15px] opacity-0"
            animate={focused ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              background:
                "linear-gradient(90deg, rgba(37,99,235,0.0), rgba(37,99,235,0.18), rgba(109,93,252,0.0))",
              padding: 1,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
            }}
          />
          <input
            ref={ref}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            className={`${compact ? "h-[50px]" : "h-[52px]"} w-full rounded-2xl border bg-slate-50 pl-16 pr-5 text-base font-semibold tracking-tight text-slate-900 outline-none transition placeholder:font-semibold placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:text-sm ${
              error
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-[#dbe3ee]"
            } ${className}`}
            {...props}
          />
        </motion.div>
        <AnimatePresence>
          {error && (
            <motion.p
              className="mt-2 text-xs font-semibold text-red-500"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

AuthInput.displayName = "AuthInput";

type PasswordInputProps = Omit<AuthInputProps, "icon" | "type"> & {
  visible: boolean;
  onToggle: () => void;
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { visible, onToggle, error, compact = false, className = "", ...props },
    ref,
  ) => (
    <div className="relative">
      <AuthInput
        ref={ref}
        icon={Lock}
        type={visible ? "text" : "password"}
        error={error}
        compact={compact}
        className={`pr-14 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  ),
);

PasswordInput.displayName = "PasswordInput";

const SocialButtons = ({ compact = false }: { compact?: boolean }) => (
  <motion.div
    variants={fieldItem}
    className="auth-social-grid grid gap-3 sm:grid-cols-3"
  >
    {[
      ["G", "Google", "text-red-500"],
      ["A", "Apple", "text-slate-950"],
      ["f", "Facebook", "text-blue-600"],
    ].map(([icon, label, color]) => (
      <motion.button
        key={label}
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`group ${compact ? "h-[46px]" : "h-12"} flex items-center justify-center gap-3 rounded-[14px] border border-slate-200 bg-white text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
      >
        <span
          className={`text-xl font-black transition-transform duration-200 group-hover:scale-110 ${color}`}
        >
          {icon}
        </span>
        {label}
      </motion.button>
    ))}
  </motion.div>
);

const SubmitButton = ({
  loading,
  label,
  loadingLabel,
  compact = false,
  motionEnabled = true,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
  compact?: boolean;
  motionEnabled?: boolean;
}) => (
  <motion.button
    variants={fieldItem}
    type="submit"
    disabled={loading}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    animate={
      motionEnabled
        ? {
            backgroundPosition: loading
              ? ["0% 50%", "100% 50%"]
              : ["0% 50%", "100% 50%", "0% 50%"],
          }
        : undefined
    }
    transition={
      motionEnabled
        ? {
            duration: loading ? 1.4 : 5,
            repeat: Infinity,
            ease: "linear",
          }
        : undefined
    }
    className={`group relative flex ${compact ? "h-[52px]" : "h-[54px]"} w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] text-base font-bold tracking-tight text-white shadow-lg shadow-blue-500/20 transition disabled:cursor-not-allowed disabled:opacity-60`}
  >
    {motionEnabled && (
      <motion.span
        className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm"
        animate={{ x: loading ? [0, 560] : [0, 440] }}
        transition={{
          duration: loading ? 1.1 : 3.2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    )}
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={loading ? "loading" : "idle"}
        className="relative z-10 flex w-full items-center justify-center gap-4"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ duration: 0.2 }}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-[5px]" />
          </>
        )}
      </motion.span>
    </AnimatePresence>
  </motion.button>
);

const EnergyArcs = ({ active }: { active: boolean }) => (
  <div className="pointer-events-none absolute -inset-8 hidden overflow-hidden rounded-[40px] lg:block">
    {[0, 1, 2].map((index) => (
      <motion.span
        key={index}
        className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-[45%] border border-blue-400/10"
        animate={active ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          duration: 18 + index * 7,
          repeat: active ? Infinity : 0,
          ease: "linear",
        }}
        style={{ transformOrigin: "50% 50%", opacity: 0.25 - index * 0.05 }}
      />
    ))}
  </div>
);

const flightPath =
  "M -140 730 C 250 720, 620 610, 880 430 C 1120 265, 1380 150, 1740 90";

const AirplaneSilhouette = () => (
  <g transform="translate(-38 -22) scale(0.92)">
    <path
      d="M76.8 20.4c4.2-1.2 7.3-.4 8.2 1.7.9 2-.8 4.6-4.8 6.4L55.4 39.7l-7.1 21.7c-.5 1.5-2.3 2.1-3.6 1.2l-7.1-5.1 3.2-13.4-16.8 7.6-6.4 8.1c-.7.9-2 1.2-3 .6l-4.9-2.5 5.8-12.4L4 38.2l4.1-4.4 16.1 3.5 17.5-11.1-14.9-6.1 6-7.6c.9-1.1 2.5-1.4 3.7-.7l21.7 12.8 18.6-4.2Z"
      fill="url(#planeBodyGradient)"
    />
    <path
      d="M55.4 39.7 77 29.8c-4.5 5.5-11.1 10.5-23.4 15.8l1.8-5.9Z"
      fill="rgba(191,219,254,0.85)"
    />
    <path
      d="M70.4 23.1c2.9-.8 5.6-.8 7.6-.2"
      stroke="rgba(255,255,255,0.75)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </g>
);

const AuthFlightTransition = ({
  active,
  direction,
}: {
  active: boolean;
  direction: 1 | -1;
}) => {
  if (!active) return null;

  const rightward = direction > 0;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-40 hidden lg:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient
            id="flightTrailGradient"
            x1="0%"
            x2="100%"
            y1="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="rgba(96,165,250,0)" />
            <stop offset="52%" stopColor="rgba(96,165,250,0.9)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.72)" />
          </linearGradient>
          <linearGradient
            id="planeBodyGradient"
            x1="0%"
            x2="100%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="48%" stopColor="#bfdbfe" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
          <filter id="flightGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="planeShadow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="5"
              floodColor="#2563eb"
              floodOpacity="0.28"
            />
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="8"
              floodColor="#60a5fa"
              floodOpacity="0.32"
            />
          </filter>
          <path id="authFlightPath" d={flightPath} />
        </defs>

        <motion.path
          d={flightPath}
          fill="none"
          stroke="url(#flightTrailGradient)"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.22"
          filter="url(#flightGlow)"
          initial={{ pathLength: rightward ? 0 : 1, opacity: 0 }}
          animate={{ pathLength: rightward ? 1 : 0, opacity: [0, 0.34, 0] }}
          transition={{ duration: 0.82, ease: cinematicEase }}
        />
        <motion.path
          d={flightPath}
          fill="none"
          stroke="url(#flightTrailGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: rightward ? 0 : 1, opacity: 0 }}
          animate={{ pathLength: rightward ? 1 : 0, opacity: [0, 1, 0] }}
          transition={{ duration: 0.82, ease: cinematicEase }}
        />
        <motion.circle
          r="6"
          fill="#93c5fd"
          filter="url(#flightGlow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.82, ease: cinematicEase }}
        >
          <animateMotion
            dur="0.82s"
            fill="freeze"
            keyPoints={rightward ? "0;1" : "1;0"}
            keyTimes="0;1"
            calcMode="linear"
          >
            <mpath href="#authFlightPath" />
          </animateMotion>
        </motion.circle>
        <g filter="url(#planeShadow)">
          <animateMotion
            dur="0.82s"
            fill="freeze"
            rotate="auto"
            keyPoints={rightward ? "0;1" : "1;0"}
            keyTimes="0;1"
            calcMode="linear"
          >
            <mpath href="#authFlightPath" />
          </animateMotion>
          <g transform={rightward ? undefined : "scale(-1 1)"}>
            <AirplaneSilhouette />
          </g>
        </g>
      </svg>
    </motion.div>
  );
};

const CompassMark = ({ className = "h-9 w-9" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <circle
      cx="24"
      cy="24"
      r="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M24 7v6M24 35v6M7 24h6M35 24h6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
    <path
      d="M30.8 14.4 25.7 28.5 17.2 33.6 22.3 19.5l8.5-5.1Z"
      fill="currentColor"
    />
    <path d="m22.3 19.5 3.4 9" stroke="white" strokeWidth="1.4" />
  </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const { login, register: registerApi } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authPresentation = useAuthPresentationMode();
  const { presentationMode, isMobile, isTablet, isDesktop, prefersReduced } = {
    presentationMode: authPresentation.mode,
    isMobile: authPresentation.isMobile,
    isTablet: authPresentation.isTablet,
    isDesktop: authPresentation.isDesktop,
    prefersReduced: authPresentation.shouldReduceMotion,
  };
  const [visualMode, setVisualMode] = React.useState<AuthMode>(initialMode);
  const [displayedFormMode, setDisplayedFormMode] =
    React.useState<AuthMode>(initialMode);
  const [displayedSceneMode, setDisplayedSceneMode] =
    React.useState<AuthMode>(initialMode);
  const [transitionPhase, setTransitionPhase] =
    React.useState<TransitionPhase>("idle");
  const [isFormVisible, setIsFormVisible] = React.useState(true);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [direction, setDirection] = React.useState<1 | -1>(
    initialMode === "register" ? 1 : -1,
  );
  const [sweepKey, setSweepKey] = React.useState(0);
  const transitionTimersRef = React.useRef<number[]>([]);
  const pendingRouteModeRef = React.useRef<AuthMode | null>(null);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [registerError, setRegisterError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = React.useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = React.useState(false);
  const [bannedAccountDialog, setBannedAccountDialog] =
    React.useState<BannedAccountDialogState | null>(null);

  React.useEffect(() => {
    if (pendingRouteModeRef.current) {
      if (initialMode === pendingRouteModeRef.current) {
        pendingRouteModeRef.current = null;
      } else {
        return;
      }
    }

    if (!isTransitioning && initialMode !== visualMode) {
      setDirection(initialMode === "register" ? 1 : -1);
      setVisualMode(initialMode);
      setDisplayedFormMode(initialMode);
      setDisplayedSceneMode(initialMode);
      setTransitionPhase("idle");
      setIsFormVisible(true);
      setSweepKey((key) => key + 1);
    }
  }, [initialMode, isTransitioning, visualMode]);

  React.useEffect(() => {
    return () => {
      transitionTimersRef.current.forEach((timer) =>
        window.clearTimeout(timer),
      );
    };
  }, []);

  React.useEffect(() => {
    if (isDesktop) return;

    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];
    setTransitionPhase("idle");
    setIsTransitioning(false);
    setIsFormVisible(true);
    setDisplayedFormMode(visualMode);
    setDisplayedSceneMode(visualMode);
  }, [isDesktop, presentationMode, visualMode]);

  React.useEffect(() => {
    if (!bannedAccountDialog?.open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBannedAccountDialog(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bannedAccountDialog?.open]);

  const justExpired = searchParams.get("expired") === "true";
  const redirectTo = searchParams.get("redirect");
  const bookingRequired = searchParams.get("reason") === "booking";
  const safeRedirectTo =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/profile";

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  React.useEffect(() => {
    (["login", "register"] as AuthMode[]).forEach((mode) => {
      const image = new Image();
      image.src = brandScenes[mode].image;
    });
  }, []);

  const isRegisterMode = visualMode === "register";
  const isRegisterFormMode = displayedFormMode === "register";
  const activeError = isRegisterFormMode ? registerError : loginError;
  const desktopMotionEnabled = isDesktop && !prefersReduced;
  const ambientActive = desktopMotionEnabled && !isTransitioning;
  const activeFormVariants = desktopMotionEnabled
    ? formVariants
    : mobileFormVariants;
  const authLayoutMode = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
  const passwordValue = registerForm.watch("password") || "";
  const passwordStrength = Math.min(
    4,
    [
      passwordValue.length >= 8,
      /[A-Z]/.test(passwordValue),
      /[0-9]/.test(passwordValue),
      /[^A-Za-z0-9]/.test(passwordValue),
    ].filter(Boolean).length,
  );

  const changeMode = (nextMode: AuthMode) => {
    if (nextMode === visualMode || isTransitioning) return;
    const nextDirection: 1 | -1 = nextMode === "register" ? 1 : -1;
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];
    setDirection(nextDirection);
    setIsTransitioning(true);
    setTransitionPhase("expanding");
    setIsFormVisible(false);
    setVisualMode(nextMode);
    setSweepKey((key) => key + 1);

    if (!desktopMotionEnabled) {
      setDisplayedFormMode(nextMode);
      setDisplayedSceneMode(nextMode);
      setIsFormVisible(true);
      pendingRouteModeRef.current = nextMode;
      window.history.replaceState(
        window.history.state,
        "",
        nextMode === "register" ? "/register" : "/login",
      );
      setTransitionPhase("idle");
      setIsTransitioning(false);
      return;
    }

    transitionTimersRef.current = [
      window.setTimeout(() => {
        setTransitionPhase("cinematic");
      }, 340),
      window.setTimeout(() => {
        setDisplayedSceneMode(nextMode);
        setDisplayedFormMode(nextMode);
      }, 520),
      window.setTimeout(() => {
        setTransitionPhase("revealing");
      }, 850),
      window.setTimeout(() => {
        setIsFormVisible(true);
      }, 930),
      window.setTimeout(() => {
        setDisplayedSceneMode(nextMode);
        setDisplayedFormMode(nextMode);
        setIsFormVisible(true);
        setTransitionPhase("idle");
        pendingRouteModeRef.current = nextMode;
        window.history.replaceState(
          window.history.state,
          "",
          nextMode === "register" ? "/register" : "/login",
        );
        setIsTransitioning(false);
      }, 1350),
    ];
  };

  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("[AuthResponsive]", {
      width: window.innerWidth,
      isMobile,
      isTablet,
      isDesktop,
      shouldReduceMotion: prefersReduced,
      presentationMode,
    });
  }, [isDesktop, isMobile, isTablet, presentationMode]);

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    setBannedAccountDialog(null);
    setIsLoginSubmitting(true);
    try {
      await login({ email: data.email, password: data.password });
      navigate(safeRedirectTo, { replace: true });
    } catch (err: unknown) {
      const error = err as AuthApiError;
      if (error?.errorCode === "ACCOUNT_BANNED") {
        const reason =
          getStringDetail(error.details?.reason) || fallbackBanReason;
        const reasonCode = getStringDetail(error.details?.reasonCode);
        const reasonLabel = getStringDetail(error.details?.reasonLabel);
        setBannedAccountDialog({
          open: true,
          message:
            error.message ||
            "Your account has been banned. Please contact support for assistance.",
          email: getStringDetail(error.details?.email) || data.email,
          reason,
          reasonCode,
          reasonLabel: getBanReasonLabel(reasonCode, reasonLabel),
          bannedAt: getStringDetail(error.details?.bannedAt),
          bannedByDisplayName: getStringDetail(
            error.details?.bannedByDisplayName,
          ),
        });
        setLoginError(null);
        return;
      }
      setLoginError(
        getAuthErrorMessage(
          error,
          "Invalid email or password. Please try again.",
        ),
      );
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setRegisterError(null);
    setIsRegisterSubmitting(true);
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      await registerApi({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        fullName,
        email: data.email.trim(),
        password: data.password,
        isProvider: false,
      });
      setSuccess(true);
      window.setTimeout(() => navigate("/login"), 1600);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setRegisterError(
        error?.message || "Registration failed. Please check your inputs.",
      );
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  return (
    <main
      className={`auth-page auth-page--${authLayoutMode} relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-[#f8fafc] font-sans antialiased lg:h-screen lg:overflow-hidden`}
    >
      <style>
        {`
          .auth-form-panel {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .auth-form-panel::-webkit-scrollbar {
            display: none;
          }

          .traveler-auth-card {
            scrollbar-width: none;
            -ms-overflow-style: none;
            --auth-workspace-background: #f8fafc;
            --ticket-notch-y: 29%;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.99), rgba(250,252,252,0.98));
            border-color: rgba(94, 170, 174, 0.32);
            box-shadow:
              0 26px 70px rgba(15, 23, 42, 0.12),
              0 6px 18px rgba(15, 23, 42, 0.05),
              inset 0 1px 0 rgba(255,255,255,0.9);
          }

          .traveler-auth-card::-webkit-scrollbar {
            display: none;
          }

          .traveler-auth-card::before,
          .traveler-auth-card::after {
            content: "";
            position: absolute;
            top: var(--ticket-notch-y);
            z-index: 25;
            width: 34px;
            height: 68px;
            border-radius: 999px;
            background: var(--auth-workspace-background);
            border: 1px solid rgba(94, 170, 174, 0.28);
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,0.72),
              0 10px 24px rgba(15, 23, 42, 0.06);
          }

          .traveler-auth-card::before {
            left: -18px;
          }

          .traveler-auth-card::after {
            right: -18px;
          }

          .traveler-auth-layer {
            position: absolute;
            inset: 12px;
            border-radius: 30px;
            pointer-events: none;
            box-shadow: 0 18px 42px rgba(15, 23, 42, 0.05);
          }

          .traveler-auth-layer-one {
            transform: rotate(-4deg) translate(-16px, 7px);
            background: rgba(224, 250, 247, 0.68);
            border: 1px solid rgba(45, 212, 191, 0.18);
          }

          .traveler-auth-layer-two {
            transform: rotate(4deg) translate(16px, 11px);
            background: rgba(255, 247, 222, 0.72);
            border: 1px solid rgba(245, 158, 11, 0.16);
          }

          .traveler-auth-stamp {
            position: absolute;
            right: 18px;
            bottom: 18px;
            z-index: 3;
            width: 84px;
            height: 84px;
            border-radius: 999px;
            border: 2px dashed rgba(14, 116, 144, 0.34);
            color: rgba(14, 116, 144, 0.34);
            pointer-events: none;
            transform: rotate(-12deg);
          }

          .traveler-auth-stamp::before {
            content: "AI MARKETPLACE";
            position: absolute;
            inset: 10px;
            display: grid;
            place-items: center;
            border-radius: inherit;
            border: 1px solid rgba(14, 116, 144, 0.25);
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-align: center;
          }

          .traveler-auth-route-line {
            position: absolute;
            left: 24px;
            top: 30%;
            bottom: 18%;
            z-index: 1;
            width: 1px;
            border-left: 2px dashed rgba(20, 184, 166, 0.34);
            pointer-events: none;
          }

          .traveler-auth-route-line::before,
          .traveler-auth-route-line::after {
            content: "";
            position: absolute;
            left: -6px;
            width: 12px;
            height: 12px;
            border-radius: 999px;
          }

          .traveler-auth-route-line::before {
            top: 0;
            background: rgb(13, 148, 136);
          }

          .traveler-auth-route-line::after {
            bottom: 0;
            background: rgb(248, 113, 113);
          }

          .traveler-auth-header::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0.28;
            background:
              radial-gradient(circle at 18% 18%, rgba(20, 184, 166, 0.16) 0 1px, transparent 1.5px),
              radial-gradient(circle at 76% 30%, rgba(37, 99, 235, 0.14) 0 1px, transparent 1.5px),
              repeating-radial-gradient(ellipse at 72% 0%, transparent 0 13px, rgba(14, 116, 144, 0.1) 14px 15px);
          }

          .auth-page--mobile,
          .auth-page--tablet {
            width: 100%;
            max-width: 480px;
            min-height: 100vh;
            min-height: 100dvh;
            height: auto;
            margin: 0 auto;
            padding: 0;
            overflow-x: clip;
            overflow-y: auto;
            background: #f8fbff;
          }

          .auth-page--tablet {
            max-width: 640px;
          }

          .auth-mobile-hero {
            position: relative;
            z-index: 1;
            height: clamp(180px, 27dvh, 220px);
            overflow: hidden;
            border-radius: 0 0 28px 28px;
            background: #0f274d;
          }

          .auth-mobile-hero::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(4,17,42,.42), rgba(4,17,42,.72));
            pointer-events: none;
          }

          .auth-mobile-hero__image {
            position: absolute;
            inset: 0;
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 40%;
          }

          .auth-mobile-hero__topbar {
            position: absolute;
            z-index: 2;
            inset: max(20px, env(safe-area-inset-top)) 20px auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .auth-mobile-hero__logo {
            width: auto;
            height: 38px;
            max-width: 180px;
            object-fit: contain;
            filter: brightness(0) invert(1) drop-shadow(0 2px 8px rgba(2,6,23,.45));
          }

          .auth-mobile-hero__language {
            display: inline-flex;
            min-height: 40px;
            align-items: center;
            gap: 6px;
            border: 0;
            border-radius: 12px;
            padding: 8px 10px;
            background: rgba(2, 6, 23, .16);
            color: #fff;
            font-size: 14px;
            font-weight: 700;
          }

          .auth-mobile-hero__language:focus-visible {
            outline: 2px solid #fff;
            outline-offset: 2px;
          }

          .auth-mobile-hero__copy {
            position: absolute;
            z-index: 2;
            left: 20px;
            right: 20px;
            bottom: 34px;
            max-width: 280px;
            margin: 0;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            line-height: 1.45;
            text-shadow: 0 2px 12px rgba(2,6,23,.55);
          }

          .auth-page--mobile .auth-form-panel,
          .auth-page--tablet .auth-form-panel {
            display: block;
            position: relative;
            z-index: 3;
            inset: auto;
            width: 100%;
            min-width: 0;
            height: auto;
            min-height: calc(100dvh - 154px);
            margin: -26px 0 0;
            transform: none;
            background-image: none;
            background: transparent;
            padding: 0;
          }

          .auth-page--mobile .auth-form-panel > *,
          .auth-page--mobile .traveler-auth-card,
          .auth-page--mobile .traveler-auth-header,
          .auth-page--mobile .traveler-auth-body,
          .auth-page--mobile .traveler-auth-body > *,
          .auth-page--mobile .traveler-auth-body form {
            min-width: 0;
            max-width: 100%;
          }

          .auth-page--mobile .traveler-auth-card,
          .auth-page--tablet .traveler-auth-card {
            width: 100%;
            max-width: none;
            margin: 0 auto;
            border: 0;
            border-radius: 28px 28px 0 0;
            box-shadow: 0 -8px 30px rgba(15,23,42,.08);
            transform: none;
          }

          .auth-page--mobile .traveler-auth-intro h2,
          .auth-page--mobile .traveler-auth-intro p {
            overflow-wrap: anywhere;
          }

          .auth-page--mobile .traveler-auth-body,
          .auth-page--tablet .traveler-auth-body {
            padding: 30px 24px max(24px, env(safe-area-inset-bottom)) !important;
          }

          .auth-page--mobile .traveler-auth-intro > p:first-child,
          .auth-page--tablet .traveler-auth-intro > p:first-child {
            display: none;
          }

          .auth-page--mobile .traveler-auth-intro h2,
          .auth-page--tablet .traveler-auth-intro h2 {
            margin-top: 0;
            margin-bottom: 0;
            font-size: clamp(30px, 8vw, 38px) !important;
            line-height: 1.04;
            letter-spacing: -0.03em;
          }

          .auth-page--mobile .traveler-auth-intro > p:last-child,
          .auth-page--tablet .traveler-auth-intro > p:last-child {
            margin-top: 12px;
            font-size: 15px;
            line-height: 1.45;
          }

          .auth-page--mobile .auth-mode-switch,
          .auth-page--tablet .auth-mode-switch {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin-top: 22px;
            padding: 4px;
            border-radius: 16px;
          }

          .auth-page--mobile .auth-mode-switch__option,
          .auth-page--tablet .auth-mode-switch__option {
            min-height: 46px;
            height: 46px;
            padding: 10px 8px;
            font-size: 14px;
          }

          .auth-page--mobile .auth-stepper,
          .auth-page--tablet .auth-stepper {
            margin-top: 14px;
            gap: 4px;
          }

          .auth-page--mobile .auth-stepper__circle,
          .auth-page--tablet .auth-stepper__circle {
            width: 30px;
            height: 30px;
          }

          .auth-page--mobile .auth-stepper__label,
          .auth-page--tablet .auth-stepper__label {
            margin-top: 4px;
            font-size: 11px;
          }

          .auth-page--mobile .auth-social-grid,
          .auth-page--tablet .auth-social-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .auth-page--mobile .auth-social-grid button,
          .auth-page--tablet .auth-social-grid button {
            gap: 6px;
            padding-inline: 8px;
          }

          .auth-page--mobile .auth-mobile-footer-switch,
          .auth-page--tablet .auth-mobile-footer-switch {
            margin: 18px -24px -24px;
            padding: 22px 20px max(24px, env(safe-area-inset-bottom));
            border-top: 1px dashed rgba(14, 116, 144, .18);
            background: linear-gradient(180deg, rgba(239,250,255,.45), rgba(231,248,252,.92));
          }

          .auth-page--mobile::before,
          .auth-page--mobile::after,
          .auth-page--tablet::before,
          .auth-page--tablet::after,
          .auth-page--mobile .auth-form-panel::before,
          .auth-page--mobile .auth-form-panel::after,
          .auth-page--tablet .auth-form-panel::before,
          .auth-page--tablet .auth-form-panel::after {
            content: none;
            display: none;
          }

          .auth-page--mobile .traveler-auth-body input,
          .auth-page--mobile .traveler-auth-body button {
            max-width: 100%;
          }

          @media (min-width: 1024px) and (max-height: 700px) {
            .auth-form-panel {
              align-items: flex-start !important;
              overflow-y: auto !important;
            }
          }

          @media (max-height: 860px) and (min-width: 1024px) {
            .auth-form-panel {
              padding-block: 12px !important;
            }

            .traveler-auth-card {
              max-height: calc(100dvh - 24px);
              overflow-y: auto;
              --ticket-notch-y: 28%;
            }

            .traveler-auth-header {
              padding-block: 12px !important;
            }

            .traveler-auth-body {
              padding-block: 15px !important;
            }

            .traveler-auth-intro h2 {
              font-size: clamp(24px, 2.4vw, 32px) !important;
            }

            .traveler-auth-protected {
              display: none !important;
            }
          }

          @media (max-width: 1023px) {
            .auth-form-panel,
            .traveler-auth-card {
              transform: none;
              inset: auto;
            }

            .auth-form-panel {
              position: relative !important;
              left: auto !important;
              top: auto !important;
              width: 100% !important;
              min-height: 0;
              height: auto;
              overflow: visible !important;
            }

            .traveler-auth-layer,
            .traveler-auth-stamp,
            .traveler-auth-route-line {
              display: none !important;
            }

            .traveler-auth-card::before,
            .traveler-auth-card::after {
              display: none;
            }

            .traveler-auth-card {
              max-height: none;
              overflow: visible;
              box-shadow:
                0 18px 44px rgba(15, 23, 42, 0.10),
                0 4px 14px rgba(15, 23, 42, 0.04) !important;
            }

            .traveler-auth-header {
              padding: 14px 18px !important;
            }

            .traveler-auth-body {
              padding: 18px !important;
            }
          }

          @media (max-width: 767px) {
            .traveler-auth-intro h2 {
              font-size: clamp(28px, 8vw, 32px) !important;
            }

            .traveler-auth-header {
              gap: 12px;
            }

            .traveler-auth-body {
              padding: 18px !important;
            }

            .auth-page--mobile .traveler-auth-body {
              padding: 30px 24px max(24px, env(safe-area-inset-bottom)) !important;
            }

            .auth-page--mobile .auth-mobile-footer-switch {
              margin-inline: -24px;
            }
          }

          @media (max-width: 767px) and (max-height: 700px) {
            .auth-page--mobile .auth-form-panel {
              min-height: calc(100dvh - 132px);
            }

            .auth-page--mobile .traveler-auth-intro h2 {
              font-size: 27px !important;
            }

            .auth-page--mobile .auth-stepper {
              margin-top: 12px;
            }

            .auth-page--mobile .auth-mobile-hero {
              height: 168px;
            }
          }

          @media (max-width: 389px) {
            .auth-mobile-hero__topbar,
            .auth-mobile-hero__copy {
              left: 18px;
              right: 18px;
            }

            .auth-mobile-hero__logo {
              height: 34px;
              max-width: 152px;
            }

            .auth-mobile-hero__language {
              padding-inline: 7px;
              font-size: 13px;
            }

            .auth-page--mobile .traveler-auth-body {
              padding-inline: 18px !important;
            }

            .auth-page--mobile .auth-mobile-footer-switch {
              margin-inline: -18px;
            }
          }

          @media (max-width: 339px) {
            .auth-page--mobile .auth-social-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .auth-page--mobile .auth-social-grid > :last-child {
              grid-column: span 2;
            }
          }

          @media (max-width: 1023px) {
            body:has(.auth-page--mobile) [aria-label="Open Travel AI Concierge"],
            body:has(.auth-page--tablet) [aria-label="Open Travel AI Concierge"] {
              display: none !important;
            }
          }

        `}
      </style>
      {isDesktop && (
        <AuthBrandPanel
          mode={displayedSceneMode}
          layoutMode={visualMode}
          transitionPhase={transitionPhase}
          isDesktop={isDesktop}
          isTransitioning={desktopMotionEnabled && isTransitioning}
          direction={direction}
        />
      )}
      {isDesktop && (
        <AnimatePresence>
          <AuthFlightTransition
            key={sweepKey}
            direction={direction}
            active={
              desktopMotionEnabled &&
              isTransitioning &&
              (transitionPhase === "cinematic" ||
                transitionPhase === "revealing")
            }
          />
        </AnimatePresence>
      )}

      <AnimatePresence>
        {bannedAccountDialog?.open && (
          <BannedAccountDialog
            state={bannedAccountDialog}
            reducedMotion={Boolean(prefersReduced)}
            onClose={() => {
              setBannedAccountDialog(null);
              loginForm.setValue("password", "");
              requestAnimationFrame(() => loginForm.setFocus("password"));
            }}
            onContactSupport={() =>
              navigate("/search", {
                state: {
                  supportContext: {
                    email: bannedAccountDialog.email,
                    errorCode: "ACCOUNT_BANNED",
                  },
                },
              })
            }
          />
        )}
      </AnimatePresence>

      {!isDesktop && <AuthMobileHero mode={displayedFormMode} />}

      <AuthFormPresentation
        isDesktop={isDesktop}
        motionEnabled={desktopMotionEnabled}
        isRegisterMode={isRegisterMode}
      >
        {desktopMotionEnabled && (
          <motion.span
          className="pointer-events-none absolute right-[8%] top-[14%] hidden h-56 w-56 rounded-full bg-blue-500/8 blur-3xl lg:block"
          animate={
            ambientActive
              ? { x: [0, 18, 0], y: [0, -14, 0], opacity: [0.2, 0.32, 0.2] }
              : { x: 0, y: 0, opacity: 0.12 }
          }
          transition={{
            duration: 19,
            repeat: ambientActive ? Infinity : 0,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          />
        )}
        {desktopMotionEnabled && (
          <motion.span
          className="pointer-events-none absolute bottom-[12%] left-[10%] hidden h-48 w-48 rounded-full bg-violet-500/7 blur-3xl lg:block"
          animate={
            ambientActive
              ? { x: [0, -16, 0], y: [0, 12, 0], opacity: [0.16, 0.26, 0.16] }
              : { x: 0, y: 0, opacity: 0.1 }
          }
          transition={{
            duration: 22,
            repeat: ambientActive ? Infinity : 0,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          />
        )}
        <AuthCardPositioner
          isDesktop={isDesktop}
          motionEnabled={desktopMotionEnabled}
          isRegisterFormMode={isRegisterFormMode}
        >
          {desktopMotionEnabled && <EnergyArcs active={ambientActive} />}
          {desktopMotionEnabled && (
            <div
            className="traveler-auth-layer traveler-auth-layer-one"
            aria-hidden="true"
            />
          )}
          {desktopMotionEnabled && (
            <div
            className="traveler-auth-layer traveler-auth-layer-two"
            aria-hidden="true"
            />
          )}
          <AuthCardSurface
            isDesktop={isDesktop}
            motionEnabled={desktopMotionEnabled}
            ambientActive={ambientActive}
          >
            {isRegisterFormMode && (
              <span
                className="traveler-auth-route-line hidden sm:block"
                aria-hidden="true"
              />
            )}
            <span
              className="traveler-auth-stamp hidden sm:block"
              aria-hidden="true"
            />
            <AnimatePresence initial={false}>
              {sweepKey > 0 && isDesktop && !prefersReduced && (
                <motion.span
                  key={sweepKey}
                  className="pointer-events-none absolute -top-12 bottom-0 z-20 w-[30%] rotate-[-12deg] bg-gradient-to-r from-transparent via-blue-500/25 to-violet-500/20 blur-2xl"
                  initial={{
                    left: direction > 0 ? "-40%" : "140%",
                    opacity: 0,
                  }}
                  animate={{
                    left:
                      direction > 0
                        ? ["-40%", "55%", "140%"]
                        : ["140%", "55%", "-40%"],
                    opacity: [0, 0.28, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.82, ease: "easeInOut" }}
                />
              )}
            </AnimatePresence>

            {isDesktop && (
              <div className="traveler-auth-header relative flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-teal-500/30 bg-[linear-gradient(180deg,rgba(248,253,253,0.98),rgba(255,255,255,0.95))] px-6 py-4 sm:px-8">
              <div className="pointer-events-none absolute right-0 top-0 h-28 w-72 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgba(37,99,235,0.16)_1px,transparent_0)] [background-size:18px_18px]" />
              <div className="relative flex items-center gap-4">
                <span
                  className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-sm ${
                    isRegisterFormMode
                      ? "border-cyan-100 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-white text-slate-950"
                  }`}
                >
                  <CompassMark />
                </span>
                <div>
                  <p
                    className={`text-[15px] font-black uppercase leading-[0.98] tracking-[0.22em] ${
                      isRegisterFormMode ? "text-cyan-800" : "text-slate-950"
                    }`}
                  >
                    {isRegisterFormMode ? "New" : "Traveler"}
                  </p>
                  <p
                    className={`text-[15px] font-black uppercase leading-[0.98] tracking-[0.22em] ${
                      isRegisterFormMode ? "text-cyan-800" : "text-slate-950"
                    }`}
                  >
                    {isRegisterFormMode ? "Traveler Pass" : "Access"}
                  </p>
                </div>
              </div>

              <p
                className={`relative hidden text-[11px] font-black uppercase tracking-[0.34em] lg:block ${
                  isRegisterFormMode ? "text-cyan-800" : "text-slate-700"
                }`}
              >
                {isRegisterFormMode ? "Discover" : "Home"}
                <span className="mx-2 text-blue-600">•</span>
                {isRegisterFormMode ? "Create" : "AI"}
                <span className="mx-2 text-blue-600">•</span>
                {isRegisterFormMode ? "Go" : "Next"}
              </p>

              <button
                type="button"
                className={`relative flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold tracking-tight text-slate-800 transition focus-visible:outline-none focus-visible:ring-2 ${
                  isRegisterFormMode
                    ? "hover:bg-cyan-50 focus-visible:ring-cyan-500"
                    : "hover:bg-blue-50 focus-visible:ring-blue-500"
                }`}
              >
                <Globe2 className="h-4 w-4" />
                English
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
              </div>
            )}

            <motion.div
              layout={desktopMotionEnabled ? "size" : undefined}
              transition={{ layout: { duration: 0.55, ease: smoothEase } }}
              className={`traveler-auth-body relative ${isRegisterFormMode ? "px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-6" : "px-6 py-6 sm:px-10 sm:py-7 lg:px-12"}`}
            >
              <AnimatePresence mode="sync" initial={false} custom={direction}>
                <motion.div
                  key={displayedFormMode}
                  custom={direction}
                  variants={activeFormVariants}
                  initial="enter"
                  animate={isFormVisible ? "center" : "curtainExit"}
                  exit="exit"
                  layout={desktopMotionEnabled}
                >
                  <motion.div
                    variants={fieldContainer}
                    initial={desktopMotionEnabled ? "hidden" : false}
                    animate={desktopMotionEnabled ? "show" : false}
                    className={isRegisterFormMode ? "space-y-3.5" : "space-y-4"}
                  >
                    <motion.div
                      variants={fieldItem}
                      className={`traveler-auth-intro ${isRegisterFormMode ? "text-center" : ""}`}
                    >
                      <p
                        className={`text-[12px] font-black uppercase tracking-[0.3em] ${
                          isRegisterFormMode ? "text-cyan-700" : "text-blue-600"
                        }`}
                      >
                        {isRegisterFormMode
                          ? "Your journey starts here"
                          : "Welcome back, traveler"}
                      </p>
                      <h2 className="mt-2 text-[clamp(27px,3vw,38px)] font-black leading-tight tracking-[-0.035em] text-slate-950">
                        {isRegisterFormMode
                          ? "Create your traveler profile"
                          : "Ready for your next journey?"}
                      </h2>
                      <p className="mx-auto mt-2 max-w-[560px] text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">
                        {isRegisterFormMode
                          ? "One account for smarter planning, seamless bookings and memorable trips."
                          : "Sign in to continue planning, booking and exploring."}
                      </p>
                    </motion.div>

                    <motion.div
                      variants={fieldItem}
                      className={`auth-mode-switch grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 ${
                        isRegisterFormMode ? "mx-auto max-w-[540px]" : ""
                      }`}
                    >
                      <button
                        type="button"
                        disabled={!isRegisterFormMode || isTransitioning}
                        onClick={() => changeMode("login")}
                        className={`auth-mode-switch__option flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition disabled:pointer-events-none ${
                          !isRegisterFormMode
                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-600 hover:bg-white hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        }`}
                      >
                        <ArrowRight className="h-4 w-4 -rotate-45" />
                        Sign in
                      </button>
                      <button
                        type="button"
                        disabled={isRegisterFormMode || isTransitioning}
                        onClick={() => changeMode("register")}
                        className={`auth-mode-switch__option flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition disabled:pointer-events-none ${
                          isRegisterFormMode
                            ? "bg-cyan-50 text-cyan-800 shadow-sm ring-1 ring-cyan-100"
                            : "text-slate-600 hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        }`}
                      >
                        <User className="h-4 w-4" />
                        Create account
                      </button>
                    </motion.div>

                    {isRegisterFormMode && (
                      <motion.div
                        variants={fieldItem}
                        className="auth-stepper mx-auto grid w-full max-w-[540px] grid-cols-3 items-start gap-2"
                        aria-label="Sign up progress"
                      >
                        {["Profile", "Preferences", "Ready"].map(
                          (step, index) => (
                            <div key={step} className="relative text-center">
                              {index < 2 && (
                                <span className="absolute left-1/2 top-4 h-px w-full bg-slate-200" />
                              )}
                              <span
                                className={`auth-stepper__circle relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${
                                  index === 0
                                    ? "border-cyan-700 bg-cyan-700 text-white"
                                    : "border-slate-300 bg-white text-slate-500"
                                }`}
                              >
                                {index + 1}
                              </span>
                              <span className="auth-stepper__label mt-1.5 block text-xs font-extrabold text-slate-700">
                                {step}
                              </span>
                            </div>
                          ),
                        )}
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {(justExpired ||
                        bookingRequired ||
                        activeError ||
                        success) && (
                        <motion.div
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold ${
                            success
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : activeError
                                ? "border-red-200 bg-red-50 text-red-600"
                                : justExpired
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-blue-200 bg-blue-50 text-blue-700"
                          }`}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                        >
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          <span>
                            {success
                              ? "Account created. Redirecting you to sign in..."
                              : activeError ||
                                (justExpired
                                  ? "Your session has expired. Please log in again."
                                  : "Please log in to book this listing.")}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isRegisterFormMode ? (
                      <form
                        className="space-y-3.5"
                        onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      >
                        <motion.div
                          variants={fieldItem}
                          className="grid gap-3 min-[390px]:grid-cols-2"
                        >
                          <div className="space-y-1.5">
                            <label
                              htmlFor="traveler-register-first-name"
                              className="text-xs font-extrabold text-slate-700"
                            >
                              First name
                            </label>
                            <AuthInput
                              compact
                              {...registerForm.register("firstName")}
                              id="traveler-register-first-name"
                              icon={User}
                              placeholder="First name"
                              autoComplete="given-name"
                              error={
                                registerForm.formState.errors.firstName?.message
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor="traveler-register-last-name"
                              className="text-xs font-extrabold text-slate-700"
                            >
                              Last name
                            </label>
                            <AuthInput
                              compact
                              {...registerForm.register("lastName")}
                              id="traveler-register-last-name"
                              icon={User}
                              placeholder="Last name"
                              autoComplete="family-name"
                              error={
                                registerForm.formState.errors.lastName?.message
                              }
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          variants={fieldItem}
                          className="space-y-1.5"
                        >
                          <label
                            htmlFor="traveler-register-email"
                            className="text-xs font-extrabold text-slate-700"
                          >
                            Email address
                          </label>
                          <AuthInput
                            compact
                            {...registerForm.register("email")}
                            id="traveler-register-email"
                            icon={Mail}
                            type="email"
                            placeholder="Email address"
                            autoComplete="email"
                            error={registerForm.formState.errors.email?.message}
                          />
                        </motion.div>
                        <motion.div
                          variants={fieldItem}
                          className="space-y-1.5"
                        >
                          <label
                            htmlFor="traveler-register-password"
                            className="text-xs font-extrabold text-slate-700"
                          >
                            Password
                          </label>
                          <PasswordInput
                            compact
                            {...registerForm.register("password")}
                            id="traveler-register-password"
                            visible={showRegisterPassword}
                            onToggle={() =>
                              setShowRegisterPassword((value) => !value)
                            }
                            placeholder="Create a password"
                            autoComplete="new-password"
                            error={
                              registerForm.formState.errors.password?.message
                            }
                          />
                          <div className="flex items-center gap-2 px-1 pt-1">
                            <div className="flex flex-1 gap-1">
                              {[0, 1, 2, 3].map((bar) => (
                                <span
                                  key={bar}
                                  className={`h-1.5 flex-1 rounded-full ${
                                    passwordStrength > bar
                                      ? "bg-cyan-600"
                                      : "bg-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-slate-500">
                              Use 6+ characters
                            </span>
                          </div>
                        </motion.div>
                        <motion.div
                          variants={fieldItem}
                          className="space-y-1.5"
                        >
                          <label
                            htmlFor="traveler-register-confirm-password"
                            className="text-xs font-extrabold text-slate-700"
                          >
                            Confirm password
                          </label>
                          <PasswordInput
                            compact
                            {...registerForm.register("confirmPassword")}
                            id="traveler-register-confirm-password"
                            visible={showConfirmPassword}
                            onToggle={() =>
                              setShowConfirmPassword((value) => !value)
                            }
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                            error={
                              registerForm.formState.errors.confirmPassword
                                ?.message
                            }
                          />
                        </motion.div>
                        <motion.div variants={fieldItem}>
                          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                            <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                              <input
                                type="checkbox"
                                {...registerForm.register("terms")}
                                className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 bg-white transition checked:border-cyan-700 checked:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                              />
                              <svg
                                viewBox="0 0 16 16"
                                className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path
                                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span>
                              I agree to the{" "}
                              <a className="font-bold text-cyan-700" href="#">
                                Terms of Service
                              </a>{" "}
                              and{" "}
                              <a className="font-bold text-cyan-700" href="#">
                                Privacy Policy
                              </a>
                            </span>
                          </label>
                          {registerForm.formState.errors.terms && (
                            <p className="mt-2 text-xs font-semibold text-red-500">
                              {registerForm.formState.errors.terms.message}
                            </p>
                          )}
                        </motion.div>
                        <motion.button
                          variants={fieldItem}
                          type="submit"
                          disabled={isRegisterSubmitting}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative flex h-[52px] w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-700 via-teal-600 to-blue-600 text-base font-black tracking-tight text-white shadow-lg shadow-cyan-600/20 transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                        >
                          <span className="absolute bottom-4 right-10 h-px w-24 border-t border-dashed border-white/55 transition group-hover:translate-x-2" />
                          <span className="relative z-10 flex w-full items-center justify-center gap-3">
                            {isRegisterSubmitting ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Creating Account...
                              </>
                            ) : (
                              <>
                                Create traveler account
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </span>
                        </motion.button>
                        <motion.p
                          variants={fieldItem}
                          className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500"
                        >
                          <ShieldCheck className="h-4 w-4 text-cyan-700" />
                          Secure account creation
                        </motion.p>
                        <motion.div
                          variants={fieldItem}
                          className="flex items-center gap-5 text-xs font-bold text-slate-500"
                        >
                          <span className="h-px flex-1 bg-slate-200" />
                          Or begin with
                          <span className="h-px flex-1 bg-slate-200" />
                        </motion.div>
                        <SocialButtons compact />
                        <motion.div
                          variants={fieldItem}
                          className="auth-mobile-footer-switch -mx-5 -mb-5 mt-2 border-t border-dashed border-teal-500/25 bg-[linear-gradient(90deg,rgba(236,253,250,0.78),rgba(239,246,255,0.78))] px-5 py-4 text-center sm:-mx-8 sm:-mb-6 sm:px-8 lg:-mx-10"
                        >
                          <p className="text-sm font-semibold text-slate-600">
                            Already a traveler?{" "}
                            <button
                              type="button"
                              onClick={() => changeMode("login")}
                              className="font-extrabold text-cyan-700 transition hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                              Sign in
                            </button>
                          </p>
                          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.36em] text-slate-400">
                            Traveler / New / 001
                          </p>
                        </motion.div>
                      </form>
                    ) : (
                      <form
                        className="space-y-4"
                        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      >
                        <motion.div variants={fieldItem} className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <label
                              htmlFor="traveler-login-email"
                              className="text-sm font-extrabold text-slate-900"
                            >
                              Email address
                            </label>
                            <span className="text-xs font-bold text-blue-600">
                              Your travel ID
                            </span>
                          </div>
                          <AuthInput
                            {...loginForm.register("email")}
                            id="traveler-login-email"
                            icon={Mail}
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            error={loginForm.formState.errors.email?.message}
                          />
                        </motion.div>
                        <motion.div variants={fieldItem} className="space-y-2">
                          <label
                            htmlFor="traveler-login-password"
                            className="text-sm font-extrabold text-slate-900"
                          >
                            Password
                          </label>
                          <PasswordInput
                            {...loginForm.register("password")}
                            id="traveler-login-password"
                            visible={showLoginPassword}
                            onToggle={() =>
                              setShowLoginPassword((value) => !value)
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            error={loginForm.formState.errors.password?.message}
                          />
                        </motion.div>
                        <motion.div
                          variants={fieldItem}
                          className="flex flex-wrap items-center justify-between gap-3 text-sm"
                        >
                          <label className="flex items-center gap-2 font-semibold text-slate-600">
                            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                              <input
                                type="checkbox"
                                {...loginForm.register("remember")}
                                className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 bg-white text-blue-600 accent-blue-600 transition checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                              />
                              <svg
                                viewBox="0 0 16 16"
                                className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path
                                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            Remember me
                          </label>
                          <a
                            href="#"
                            className="font-bold text-blue-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            Forgot password?
                          </a>
                        </motion.div>
                        <SubmitButton
                          loading={isLoginSubmitting}
                          label="Continue journey"
                          loadingLabel="Signing In..."
                          motionEnabled={desktopMotionEnabled}
                        />
                        <motion.p
                          variants={fieldItem}
                          className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500"
                        >
                          <ShieldCheck className="h-4 w-4 text-slate-500" />
                          Secure access to your trips and bookings
                        </motion.p>
                        <motion.div
                          variants={fieldItem}
                          className="flex items-center gap-5 text-xs font-bold text-slate-500"
                        >
                          <span className="h-px flex-1 bg-slate-200" />
                          Or board with
                          <span className="h-px flex-1 bg-slate-200" />
                        </motion.div>
                        <SocialButtons />
                        <motion.p
                          variants={fieldItem}
                          className="auth-mobile-footer-switch -mx-6 -mb-6 mt-2 border-t border-dashed border-blue-500/20 bg-[linear-gradient(90deg,rgba(239,246,255,0.8),rgba(236,253,250,0.66))] px-6 py-4 text-center text-sm font-semibold text-slate-500 sm:-mx-10 sm:-mb-7 sm:px-10 lg:-mx-12"
                        >
                          New traveler?{" "}
                          <button
                            type="button"
                            onClick={() => changeMode("register")}
                            className="font-extrabold text-blue-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            Create your account
                          </button>
                        </motion.p>
                      </form>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </AuthCardSurface>
        </AuthCardPositioner>
      </AuthFormPresentation>
    </main>
  );
};

const BannedAccountDialog = ({
  state,
  reducedMotion,
  onClose,
  onContactSupport,
}: {
  state: BannedAccountDialogState;
  reducedMotion: boolean;
  onClose: () => void;
  onContactSupport: () => void;
}) => {
  const contentTransition = reducedMotion
    ? { duration: 0.01 }
    : { duration: 0.22, ease: smoothEase };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reducedMotion ? { duration: 0.08 } : { duration: 0.22 }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="banned-account-title"
        aria-describedby="banned-account-description"
        className="relative flex w-[min(1100px,calc(100vw-40px))] max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/25"
        initial={
          reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }
        }
        animate={
          reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
        }
        exit={
          reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }
        }
        transition={contentTransition}
      >
        <button
          type="button"
          aria-label="Close account restriction dialog"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-7 sm:px-7 lg:px-10 lg:pb-6 lg:pt-8">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
            <BannedAccountHero reducedMotion={reducedMotion} />
            <BannedAccountIllustration reducedMotion={reducedMotion} />
          </div>

          <BannedAccountDetails
            email={state.email}
            reasonLabel={getBanReasonLabel(state.reasonCode, state.reasonLabel)}
            reason={state.reason || fallbackBanReason}
            bannedAt={state.bannedAt}
            bannedByDisplayName={state.bannedByDisplayName}
          />

          <BannedNextSteps />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:border-blue-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to sign in
            </button>
            <button
              type="button"
              onClick={onContactSupport}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Headphones className="h-4 w-4" />
              Contact support
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              For your security, access to this account has been restricted.
            </span>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

const BannedAccountHero = ({ reducedMotion }: { reducedMotion: boolean }) => (
  <motion.div
    className="min-w-0 pr-10 md:pr-0"
    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
    animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
    transition={{ duration: reducedMotion ? 0.01 : 0.22, ease: smoothEase }}
  >
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100 sm:h-20 sm:w-20">
        <ShieldAlert className="h-9 w-9 sm:h-11 sm:w-11" />
      </span>
      <span className="rounded-full bg-rose-50 px-5 py-2 text-sm font-black text-rose-600 ring-1 ring-rose-100">
        Account Banned
      </span>
    </div>
    <h2
      id="banned-account-title"
      className="mt-5 max-w-xl text-[30px] font-black leading-tight tracking-tight text-slate-950 sm:text-[38px] lg:text-[44px]"
    >
      Your account has been banned
    </h2>
    <p
      id="banned-account-description"
      className="mt-3 max-w-md text-base font-semibold leading-7 text-slate-500 sm:text-lg"
    >
      You can no longer access this account or use AI Marketplace Traveler.
    </p>
  </motion.div>
);

const BannedAccountIllustration = ({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) => (
  <motion.div
    className="mx-auto flex h-[170px] w-full max-w-[300px] items-center justify-center overflow-hidden sm:h-[230px] sm:max-w-[340px] lg:h-[280px] lg:max-w-[390px]"
    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
    animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
    transition={{
      duration: reducedMotion ? 0.01 : 0.24,
      delay: reducedMotion ? 0 : 0.04,
      ease: smoothEase,
    }}
  >
    <img
      src={bannedAccountIllustration}
      alt="Sad traveler sitting beside a suitcase after account restriction"
      className="h-full w-full object-contain object-center"
      loading="eager"
      draggable={false}
    />
  </motion.div>
);

const BannedAccountDetails = ({
  email,
  reasonLabel,
  reason,
  bannedAt,
  bannedByDisplayName,
}: {
  email: string;
  reasonLabel: string;
  reason: string;
  bannedAt?: string;
  bannedByDisplayName?: string;
}) => (
  <motion.div
    className={`mt-6 grid overflow-hidden rounded-[18px] border border-slate-200 bg-white ${
      bannedByDisplayName
        ? "lg:grid-cols-[1.35fr_0.9fr_1.25fr_0.9fr_0.85fr]"
        : "lg:grid-cols-[1.35fr_0.9fr_1.35fr_0.9fr]"
    }`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay: 0.1, ease: smoothEase }}
  >
    <BannedInfoItem icon={User} label="Account" value={email} />
    <BannedInfoItem
      icon={AlertCircle}
      label="Reason"
      value={reasonLabel || "Account restriction"}
      tone="rose"
    />
    <BannedInfoItem
      icon={FileText}
      label="Details"
      value={reason || fallbackBanReason}
    />
    <BannedInfoItem
      icon={CalendarDays}
      label="Banned on"
      value={formatBannedDate(bannedAt)}
    />
    {bannedByDisplayName && (
      <BannedInfoItem
        icon={ShieldCheck}
        label="Banned by"
        value={bannedByDisplayName}
      />
    )}
  </motion.div>
);

const BannedInfoItem = ({
  icon: Icon,
  label,
  value,
  tone = "blue",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "blue" | "rose";
}) => (
  <div className="min-w-0 border-b border-slate-100 px-4 py-3.5 last:border-b-0 sm:px-5 sm:py-4 lg:border-b-0 lg:border-r lg:last:border-r-0">
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-black text-slate-500">{label}</span>
    </div>
    <p
      className={`mt-3 min-w-0 text-sm font-black leading-6 ${tone === "rose" ? "text-rose-600" : "text-slate-950"}`}
    >
      {value}
    </p>
  </div>
);

const BannedNextSteps = () => (
  <motion.div
    className="mt-6 rounded-[18px] border border-blue-100 bg-blue-50/35 px-5 py-4 sm:px-6 sm:py-5"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay: 0.18, ease: smoothEase }}
  >
    <div>
      <h3 className="text-lg font-black text-slate-950">What you can do</h3>
      <ul className="mt-4 grid gap-4 text-sm font-semibold leading-relaxed text-slate-600 md:grid-cols-3 md:gap-5">
        <li className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          Contact our support team for more information.
        </li>
        <li className="flex items-start gap-3">
          <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          Submit an appeal if you believe this was a mistake.
        </li>
        <li className="flex items-start gap-3">
          <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          Our team will review your case and respond when possible.
        </li>
      </ul>
    </div>
  </motion.div>
);

export default AuthPage;
