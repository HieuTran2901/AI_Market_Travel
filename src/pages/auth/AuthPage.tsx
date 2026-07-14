import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "login" | "register";
type TransitionPhase = "idle" | "expanding" | "cinematic" | "revealing";

type AuthPageProps = {
  initialMode: AuthMode;
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
            className={`${compact ? "h-[50px]" : "h-[52px]"} w-full rounded-2xl border bg-slate-50 pl-16 pr-5 text-sm font-semibold tracking-tight text-slate-900 outline-none transition placeholder:font-semibold placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
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

const Divider = ({ compact = false }: { compact?: boolean }) => (
  <motion.div
    variants={fieldItem}
    className={`flex items-center ${compact ? "gap-4" : "gap-6"} text-xs font-bold text-slate-500`}
  >
    <span className="h-px flex-1 bg-slate-200" />
    or continue with
    <span className="h-px flex-1 bg-slate-200" />
  </motion.div>
);

const SocialButtons = ({ compact = false }: { compact?: boolean }) => (
  <motion.div variants={fieldItem} className="grid gap-3 sm:grid-cols-3">
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
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
  compact?: boolean;
}) => (
  <motion.button
    variants={fieldItem}
    type="submit"
    disabled={loading}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    animate={{
      backgroundPosition: loading
        ? ["0% 50%", "100% 50%"]
        : ["0% 50%", "100% 50%", "0% 50%"],
    }}
    transition={{
      duration: loading ? 1.4 : 5,
      repeat: Infinity,
      ease: "linear",
    }}
    className={`group relative flex ${compact ? "h-[52px]" : "h-[54px]"} w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] text-base font-bold tracking-tight text-white shadow-lg shadow-blue-500/20 transition disabled:cursor-not-allowed disabled:opacity-60`}
  >
    <motion.span
      className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm"
      animate={{ x: loading ? [0, 560] : [0, 440] }}
      transition={{
        duration: loading ? 1.1 : 3.2,
        repeat: Infinity,
        ease: "linear",
      }}
    />
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

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const { login, register: registerApi } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefersReduced = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
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

  const isRegisterMode = visualMode === "register";
  const isRegisterFormMode = displayedFormMode === "register";
  const activeError = isRegisterFormMode ? registerError : loginError;
  const ambientActive = isDesktop && !prefersReduced && !isTransitioning;

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

    if (!isDesktop || prefersReduced) {
      setDisplayedFormMode(nextMode);
      setDisplayedSceneMode(nextMode);
      setIsFormVisible(true);
      window.setTimeout(
        () => {
          pendingRouteModeRef.current = nextMode;
          navigate(nextMode === "register" ? "/register" : "/login", {
            replace: true,
          });
          setTransitionPhase("idle");
          setIsTransitioning(false);
        },
        prefersReduced ? 0 : 560,
      );
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
        navigate(nextMode === "register" ? "/register" : "/login", {
          replace: true,
        });
        setIsTransitioning(false);
      }, 1350),
    ];
  };

  const handlePanelAnimationComplete = () => {
    if (!isTransitioning) return;
    if (isDesktop && !prefersReduced) return;
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];
    setDisplayedFormMode(visualMode);
    setDisplayedSceneMode(visualMode);
    setIsFormVisible(true);
    setTransitionPhase("idle");
    pendingRouteModeRef.current = visualMode;
    navigate(visualMode === "register" ? "/register" : "/login", {
      replace: true,
    });
    setIsTransitioning(false);
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    setIsLoginSubmitting(true);
    try {
      await login({ email: data.email, password: data.password });
      navigate(safeRedirectTo, { replace: true });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setLoginError(
        error?.message || "Invalid email or password. Please try again.",
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
    <main className="relative h-screen min-h-screen overflow-hidden bg-[#f8fafc] font-sans antialiased">
      <style>
        {`
          .auth-form-panel {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .auth-form-panel::-webkit-scrollbar {
            display: none;
          }

          @media (min-width: 1024px) and (max-height: 700px) {
            .auth-form-panel {
              align-items: flex-start !important;
              overflow-y: auto !important;
            }
          }
        `}
      </style>
      <AuthBrandPanel
        mode={displayedSceneMode}
        layoutMode={visualMode}
        transitionPhase={transitionPhase}
        isDesktop={isDesktop}
        isTransitioning={isDesktop && isTransitioning && !prefersReduced}
        direction={direction}
      />
      <AnimatePresence>
        <AuthFlightTransition
          key={sweepKey}
          direction={direction}
          active={
            isDesktop &&
            isTransitioning &&
            !prefersReduced &&
            (transitionPhase === "cinematic" || transitionPhase === "revealing")
          }
        />
      </AnimatePresence>

      <motion.section
        className="auth-form-panel relative z-10 flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#f8fafc] px-4 py-8 sm:px-6 lg:absolute lg:left-0 lg:top-0 lg:h-screen lg:min-h-0 lg:w-1/2 lg:overflow-hidden lg:px-8 lg:py-4 xl:px-12 2xl:px-16"
        initial={false}
        animate={{
          left: isDesktop && isRegisterMode ? "0%" : isDesktop ? "50%" : "0%",
        }}
        transition={prefersReduced ? { duration: 0 } : panelTransition}
        onAnimationComplete={handlePanelAnimationComplete}
        style={{ willChange: "left", transform: "translateZ(0)", zIndex: 10 }}
      >
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
        <div className="mb-6 flex justify-center lg:hidden">
          <img
            src="/brand/ai-marketplace-traveler-logo.png"
            alt="AI Marketplace Traveler"
            className="h-14 w-auto max-w-[210px] object-contain"
          />
        </div>

        <motion.div
          layout
          animate={{ y: isDesktop && isRegisterFormMode ? -6 : 0 }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 0.45, ease: smoothEase }
          }
          className="relative mx-auto w-full max-w-[680px] lg:w-[88%] lg:max-w-[640px] xl:max-w-[660px] 2xl:max-w-[720px]"
        >
          <EnergyArcs active={ambientActive} />
          <motion.div
            layout
            className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)] max-md:rounded-[20px] max-md:shadow-none"
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
            <AnimatePresence initial={false}>
              {sweepKey > 0 && !prefersReduced && (
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

            <div className="grid grid-cols-[1fr_auto] items-center border-b border-slate-200">
              <div className="relative grid grid-cols-2">
                {(["login", "register"] as AuthMode[]).map((tabMode) => {
                  const active = visualMode === tabMode;
                  return (
                    <button
                      key={tabMode}
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => changeMode(tabMode)}
                      className={`relative flex h-16 items-center justify-center text-base font-extrabold tracking-tight transition disabled:pointer-events-none lg:h-[68px] ${active ? "text-blue-600" : "text-slate-950"}`}
                    >
                      {tabMode === "login" ? "Sign In" : "Sign Up"}
                      {active && (
                        <motion.span
                          layoutId="auth-active-tab"
                          className="absolute bottom-0 h-[3px] w-44 max-w-[70%] rounded-full bg-blue-600 shadow-[0_0_18px_rgba(37,99,235,0.28)]"
                        >
                          <span className="absolute inset-x-4 -top-2 h-5 rounded-full bg-blue-500/20 blur-[10px]" />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="mr-6 hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold tracking-tight text-slate-800 shadow-sm transition hover:border-blue-200 sm:flex"
              >
                <Globe2 className="h-4 w-4 text-slate-500" />
                English
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <motion.div
              layout="size"
              transition={{ layout: { duration: 0.55, ease: smoothEase } }}
              className={`${isRegisterFormMode ? "px-5 py-4 sm:px-7 sm:py-5 lg:px-9 lg:py-5 xl:px-10" : "px-6 py-6 sm:px-9 sm:py-7 lg:px-10 lg:py-7 xl:px-12"}`}
            >
              <AnimatePresence mode="sync" initial={false} custom={direction}>
                <motion.div
                  key={displayedFormMode}
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate={isFormVisible ? "center" : "curtainExit"}
                  exit="exit"
                  layout
                >
                  <motion.div
                    variants={fieldContainer}
                    initial="hidden"
                    animate="show"
                    className={isRegisterFormMode ? "space-y-3.5" : "space-y-4"}
                  >
                    <motion.div
                      variants={fieldItem}
                      className={isRegisterFormMode ? "mb-3" : "mb-5"}
                    >
                      {/* <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                        {isRegisterFormMode ? "Start your journey" : "Welcome back"}
                      </p> */}
                      <h2 className="flex items-start gap-3 text-[30px] font-black leading-tight tracking-tight text-slate-950 sm:text-[34px]">
                        {isRegisterFormMode
                          ? "Create your account"
                          : "Welcome back"}
                        {isRegisterFormMode && (
                          <Sparkles className="mt-1 h-5 w-5 text-blue-600" />
                        )}
                      </h2>
                      <p className="mt-1.5 text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">
                        {isRegisterFormMode
                          ? "Start your adventure with AI Marketplace"
                          : "Continue your journey with AI Marketplace"}
                      </p>
                    </motion.div>

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
                          className="grid gap-4 sm:grid-cols-2"
                        >
                          <AuthInput
                            compact
                            {...registerForm.register("firstName")}
                            icon={User}
                            placeholder="First name"
                            autoComplete="given-name"
                            error={
                              registerForm.formState.errors.firstName?.message
                            }
                          />
                          <AuthInput
                            compact
                            {...registerForm.register("lastName")}
                            icon={User}
                            placeholder="Last name"
                            autoComplete="family-name"
                            error={
                              registerForm.formState.errors.lastName?.message
                            }
                          />
                        </motion.div>
                        <motion.div variants={fieldItem}>
                          <AuthInput
                            compact
                            {...registerForm.register("email")}
                            icon={Mail}
                            type="email"
                            placeholder="Email address"
                            autoComplete="email"
                            error={registerForm.formState.errors.email?.message}
                          />
                        </motion.div>
                        <motion.div variants={fieldItem}>
                          <PasswordInput
                            compact
                            {...registerForm.register("password")}
                            visible={showRegisterPassword}
                            onToggle={() =>
                              setShowRegisterPassword((value) => !value)
                            }
                            placeholder="Password"
                            autoComplete="new-password"
                            error={
                              registerForm.formState.errors.password?.message
                            }
                          />
                        </motion.div>
                        <motion.div variants={fieldItem}>
                          <PasswordInput
                            compact
                            {...registerForm.register("confirmPassword")}
                            visible={showConfirmPassword}
                            onToggle={() =>
                              setShowConfirmPassword((value) => !value)
                            }
                            placeholder="Confirm password"
                            autoComplete="new-password"
                            error={
                              registerForm.formState.errors.confirmPassword
                                ?.message
                            }
                          />
                        </motion.div>
                        <motion.div variants={fieldItem}>
                          <label className="flex items-start gap-3 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                            <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                              <input
                                type="checkbox"
                                {...registerForm.register("terms")}
                                className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 bg-white transition checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                              <a className="font-bold text-blue-600" href="#">
                                Terms of Service
                              </a>{" "}
                              and{" "}
                              <a className="font-bold text-blue-600" href="#">
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
                        <SubmitButton
                          compact
                          loading={isRegisterSubmitting}
                          label="Create Account"
                          loadingLabel="Creating Account..."
                        />
                        <Divider compact />
                        <SocialButtons compact />
                        <motion.p
                          variants={fieldItem}
                          className="text-center text-sm font-semibold text-slate-500"
                        >
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={() => changeMode("login")}
                            className="font-bold text-blue-600"
                          >
                            Sign in
                          </button>
                        </motion.p>
                      </form>
                    ) : (
                      <form
                        className="space-y-4"
                        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      >
                        <motion.div variants={fieldItem}>
                          <AuthInput
                            {...loginForm.register("email")}
                            icon={Mail}
                            type="email"
                            placeholder="Email address"
                            autoComplete="email"
                            error={loginForm.formState.errors.email?.message}
                          />
                        </motion.div>
                        <motion.div variants={fieldItem}>
                          <PasswordInput
                            {...loginForm.register("password")}
                            visible={showLoginPassword}
                            onToggle={() =>
                              setShowLoginPassword((value) => !value)
                            }
                            placeholder="Password"
                            autoComplete="current-password"
                            error={loginForm.formState.errors.password?.message}
                          />
                        </motion.div>
                        <motion.div
                          variants={fieldItem}
                          className="flex items-center justify-between gap-4 text-sm"
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
                          <a href="#" className="font-bold text-blue-600">
                            Forgot password?
                          </a>
                        </motion.div>
                        <SubmitButton
                          loading={isLoginSubmitting}
                          label="Sign In"
                          loadingLabel="Signing In..."
                        />
                        <Divider />
                        <SocialButtons />
                        <motion.p
                          variants={fieldItem}
                          className="text-center text-sm font-semibold text-slate-500"
                        >
                          Don&apos;t have an account?{" "}
                          <button
                            type="button"
                            onClick={() => changeMode("register")}
                            className="font-bold text-blue-600"
                          >
                            Sign up
                          </button>
                        </motion.p>
                      </form>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </main>
  );
};

export default AuthPage;
