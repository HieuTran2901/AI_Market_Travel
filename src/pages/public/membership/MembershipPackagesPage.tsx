import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Gift,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MembershipCoinTopLayout } from "../ai-coins/MembershipCoinTopLayout";
import {
  cardContainerVariants,
  cardItemVariants,
  UpgradeModeTransition,
  UpgradeThemeGlow,
  useUpgradeModeTransition,
} from "../ai-coins/useUpgradeModeTransition";
import coinGoldImage from "@/assets/images/coin-gold.png";
import beginnerIcon from "@/assets/images/01-paper-plane.png";
import beginnerLandscape from "@/assets/images/01-beginner-tropical-beach.png";
import masterIcon from "@/assets/images/02-compass.png";
import masterLandscape from "@/assets/images/02-master-mountain-road.png";
import proIcon from "@/assets/images/03-rocket.png";
import proLandscape from "@/assets/images/03-pro-paris-city.png";
import ultraIcon from "@/assets/images/04-crystal.png";
import ultraLandscape from "@/assets/images/04-ultra-luxury-villa.png";
import galaxyIcon from "@/assets/images/05-crowned-planet.png";
import galaxyLandscape from "@/assets/images/05-galaxy-space.png";
import { AnimatedNumber } from "../upgrade/AnimatedNumber";
import { upgradeSectionVariants } from "../upgrade/upgradeMotion";

export type BillingCycle = "monthly" | "yearly";

type MembershipPlan = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  button: string;
  icon: string;
  landscape: string;
  features: string[];
  accent: string;
  accentSoft: string;
  border: string;
  glow: string;
  buttonClassName: string;
  featured?: boolean;
};

const plans: MembershipPlan[] = [
  {
    id: "beginner",
    name: "Beginner",
    tagline: "Khởi đầu hành trình",
    price: "49.000 đ",
    button: "Chọn gói",
    icon: beginnerIcon,
    landscape: beginnerLandscape,
    accent: "text-cyan-200",
    accentSoft: "text-cyan-300",
    border: "border-cyan-300/45",
    glow: "rgba(45, 212, 191, 0.22)",
    buttonClassName:
      "border-cyan-300/52 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/20",
    features: [
      "Tích lũy 50 AI Coins mỗi tháng",
      "Ưu đãi thành viên cơ bản",
      "Hỗ trợ AI lên lịch chuyến đi",
      "Lưu 5 hành trình yêu thích",
      "Hỗ trợ qua email",
    ],
  },
  {
    id: "master",
    name: "Master",
    tagline: "Trải nghiệm nâng cao",
    price: "129.000 đ",
    button: "Chọn gói",
    icon: masterIcon,
    landscape: masterLandscape,
    accent: "text-blue-200",
    accentSoft: "text-sky-300",
    border: "border-blue-300/42",
    glow: "rgba(59, 130, 246, 0.23)",
    buttonClassName:
      "border-blue-300/52 bg-blue-500/18 text-blue-50 hover:bg-blue-500/28",
    features: [
      "Tích lũy 150 AI Coins mỗi tháng",
      "Giảm giá độc quyền đến 10%",
      "AI đề xuất hành trình cá nhân hóa",
      "Lưu không giới hạn hành trình",
      "Hỗ trợ ưu tiên",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Lựa chọn tối ưu",
    price: "249.000 đ",
    button: "Chọn gói",
    icon: proIcon,
    landscape: proLandscape,
    accent: "text-amber-200",
    accentSoft: "text-amber-300",
    border: "border-amber-300/80",
    glow: "rgba(245, 158, 11, 0.34)",
    buttonClassName:
      "border-orange-300/70 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_14px_30px_rgba(245,158,11,0.24)] hover:from-amber-400 hover:to-orange-500",
    featured: true,
    features: [
      "Tích lũy 300 AI Coins mỗi tháng",
      "Giảm giá độc quyền đến 20%",
      "AI lập kế hoạch chuyến đi thông minh",
      "Truy cập phòng chờ sân bay",
      "Hỗ trợ 24/7 ưu tiên cao",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    tagline: "Đẳng cấp vượt trội",
    price: "499.000 đ",
    button: "Chọn gói",
    icon: ultraIcon,
    landscape: ultraLandscape,
    accent: "text-violet-200",
    accentSoft: "text-fuchsia-300",
    border: "border-violet-300/48",
    glow: "rgba(168, 85, 247, 0.24)",
    buttonClassName:
      "border-violet-300/52 bg-violet-500/26 text-violet-50 hover:bg-violet-500/36",
    features: [
      "Tích lũy 600 AI Coins mỗi tháng",
      "Giảm giá độc quyền đến 30%",
      "AI Travel Concierge 1:1",
      "Nâng hạng phòng miễn phí",
      "Hoàn tiền linh hoạt",
    ],
  },
  {
    id: "galaxy",
    name: "Galaxy",
    tagline: "Đỉnh cao đặc quyền",
    price: "999.000 đ",
    button: "Chọn gói",
    icon: galaxyIcon,
    landscape: galaxyLandscape,
    accent: "text-indigo-100",
    accentSoft: "text-blue-300",
    border: "border-indigo-300/48",
    glow: "rgba(99, 102, 241, 0.26)",
    buttonClassName:
      "border-indigo-300/52 bg-indigo-500/24 text-indigo-50 hover:bg-indigo-500/34",
    features: [
      "Tích lũy 1.200 AI Coins mỗi tháng",
      "Giảm giá độc quyền đến 40%",
      "AI Travel Concierge riêng biệt",
      "Trải nghiệm cá nhân hóa 100%",
      "Đặc quyền & sự kiện VIP",
    ],
  },
];

const infoBlocks = [
  {
    title: "AI Coins là gì?",
    description:
      "AI Coins là đơn vị điểm thưởng độc quyền của AI Marketplace Traveler. Dùng để thanh toán, nhận ưu đãi và nâng cấp trải nghiệm của bạn!",
    icon: WalletCards,
    iconClassName: "text-amber-200",
  },
  {
    title: "Thanh toán dễ dàng",
    description: "Dùng AI Coins để đặt dịch vụ",
    icon: CreditCard,
    iconClassName: "text-cyan-200",
  },
  {
    title: "Nhận ưu đãi độc quyền",
    description: "Tiết kiệm hơn khi thanh toán",
    icon: Gift,
    iconClassName: "text-amber-200",
  },
  {
    title: "Tích lũy linh hoạt",
    description: "Nhận Coins từ mọi hoạt động",
    icon: Sparkles,
    iconClassName: "text-violet-200",
  },
];

export const MembershipBillingControls = ({
  billingCycle,
  setBillingCycle,
}: {
  billingCycle: BillingCycle;
  setBillingCycle: React.Dispatch<React.SetStateAction<BillingCycle>>;
}) => (
  <div className="w-full rounded-3xl border border-violet-300/18 bg-[linear-gradient(135deg,rgba(13,23,61,0.82),rgba(24,18,57,0.88))] p-3 shadow-[0_14px_34px_rgba(2,8,23,0.22)]">
    <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(210px,1fr)] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={coinGoldImage}
          alt=""
          draggable={false}
          className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_12px_26px_rgba(245,158,11,0.24)]"
        />
        <div className="min-w-0">
          <p className="text-sm font-black text-white">Save up to 30%</p>
          <p className="mt-0.5 text-xs text-slate-300">
            With annual billing
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="grid grid-cols-3 rounded-full border border-white/8 bg-white/[0.04] p-1">
          {[
            ["monthly", "Monthly"],
            ["yearly", "Yearly"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setBillingCycle(value as BillingCycle)}
              className={cn(
                "relative h-8 rounded-full px-2 text-[11px] font-black transition focus:outline-none focus:ring-2 focus:ring-violet-300",
                billingCycle === value
                  ? "text-white"
                  : "text-slate-300 hover:bg-white/[0.04]",
              )}
            >
              {billingCycle === value ? (
                <motion.span
                  layoutId="membership-billing-active"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-violet-500/24 ring-1 ring-violet-300/60"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              ) : null}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
          <span className="flex h-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 text-[10px] font-black text-white">
            Save 30%
          </span>
        </div>
      </div>
    </div>
  </div>
);

export const MembershipIntro = () => (
  <div className="min-w-0">
    <h1 className="max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
      Choose the{" "}
      <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
        membership plan
      </span>{" "}
      that suits you
    </h1>
    <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-300">
      Unlock exclusive privileges and elevate your AI travel experience.
    </p>
    <div className="mt-4 flex flex-wrap gap-3">
      <span className="inline-flex items-center gap-2 rounded-2xl border border-blue-300/16 bg-blue-400/8 px-4 py-2 text-sm font-bold text-slate-100">
        <ShieldCheck className="h-4 w-4 text-blue-300" />
        Secure payment
      </span>
      <span className="inline-flex items-center gap-2 rounded-2xl border border-blue-300/16 bg-blue-400/8 px-4 py-2 text-sm font-bold text-slate-100">
        <RotateCcw className="h-4 w-4 text-sky-300" />
        Cancel anytime
      </span>
    </div>
  </div>
);

const MembershipHeader = ({
  billingCycle,
  setBillingCycle,
  transition,
}: {
  billingCycle: BillingCycle;
  setBillingCycle: React.Dispatch<React.SetStateAction<BillingCycle>>;
  transition: UpgradeModeTransition;
}) => (
  <MembershipCoinTopLayout
    activeTab="membership"
    visualTab={transition.visualMode}
    isTransitioning={transition.isTransitioning}
    onTabSelect={transition.switchMode}
    left={<MembershipIntro />}
    controls={
      <MembershipBillingControls
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
      />
    }
  />
);

const membershipPriceFormatter = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const AnimatedFeatureText = ({
  text,
  playKey,
}: {
  text: string;
  playKey: string;
}) => {
  const match = text.match(/(\d[\d.]*)/);
  if (!match || match.index === undefined) return <>{text}</>;

  const numericValue = Number(match[1].replace(/\./g, ""));
  if (!Number.isFinite(numericValue)) return <>{text}</>;

  return (
    <>
      {text.slice(0, match.index)}
      <AnimatedNumber
        value={numericValue}
        duration={0.58}
        formatter={membershipPriceFormatter}
        playKey={playKey}
        className="tabular-nums"
      />
      {text.slice(match.index + match[1].length)}
    </>
  );
};

const MembershipPlanCard = ({
  plan,
  billingCycle,
}: {
  plan: MembershipPlan;
  billingCycle: BillingCycle;
}) => {
  const shouldReduceMotion = useReducedMotion();
  const priceValue = Number(plan.price.replace(/\D/g, ""));
  const playKey = `${billingCycle}-${plan.id}`;

  return (
  <motion.article
    whileHover={
      shouldReduceMotion ? undefined : { y: -4, scale: 1.008 }
    }
    whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      "group relative mt-12 flex min-h-[610px] min-w-0 flex-col overflow-visible rounded-[2rem]",
      plan.featured && "xl:-translate-y-4",
    )}
    style={{
      boxShadow: plan.featured
        ? `0 0 42px ${plan.glow}, 0 22px 58px rgba(2,8,23,0.32)`
        : `0 18px 48px rgba(2,8,23,0.28), 0 0 24px ${plan.glow}`,
    }}
  >
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,rgba(8,24,58,0.98),rgba(4,15,40,0.995))]",
        plan.border,
      )}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at 50% 3%, ${plan.glow}, transparent 31%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[158px] overflow-hidden rounded-b-[2rem]">
        <img
          src={plan.landscape}
          alt=""
          draggable={false}
          className="h-full w-full object-cover object-bottom transition duration-500 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(4,15,40,1)] via-[rgba(4,15,40,0.32)] to-transparent" />
        <div
          className="absolute inset-x-8 bottom-0 h-16 opacity-40 blur-2xl"
          style={{ backgroundColor: plan.glow }}
        />
      </div>
    </div>

    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[-2px] z-20 h-[5px] w-[9.5rem] -translate-x-1/2"
      style={{ backgroundColor: "rgb(8 24 58)" }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[calc(50%_-_4.75rem)] top-0 z-20 h-4 w-4 -translate-x-full rounded-tr-xl border-r border-t border-l-transparent border-b-transparent"
      style={{ borderRightColor: plan.glow, borderTopColor: plan.glow }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-[calc(50%_-_4.75rem)] top-0 z-20 h-4 w-4 translate-x-full rounded-tl-xl border-l border-t border-r-transparent border-b-transparent"
      style={{ borderLeftColor: plan.glow, borderTopColor: plan.glow }}
    />

    <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-32 w-32 -translate-x-1/2 -translate-y-[42%]">
      <span
        className="absolute inset-2 rounded-full opacity-70 blur-2xl"
        style={{ backgroundColor: plan.glow }}
      />
      <img
        src={plan.icon}
        alt={`${plan.name} membership icon`}
        draggable={false}
        className="relative h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.42)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105"
      />
    </div>

    {plan.featured ? (
      <span className="absolute right-0 top-0 z-40 flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200/70 bg-[linear-gradient(105deg,rgba(249,115,22,0.98),rgba(236,72,153,0.96))] px-3.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[0_5px_18px_rgba(236,72,153,0.28),0_0_18px_rgba(245,158,11,0.22)] ring-1 ring-white/10 backdrop-blur-sm">
        PHỔ BIẾN NHẤT
      </span>
    ) : null}

    <div className="relative z-10 flex flex-1 flex-col px-5 pb-[148px] pt-[5.25rem] text-center">
      <h2 className="text-2xl font-black text-white">{plan.name}</h2>
      <p className={cn("mt-1 text-sm font-bold", plan.accentSoft)}>
        {plan.tagline}
      </p>
      <p className="mt-5 text-2xl font-black text-white">
        <AnimatedNumber
          value={priceValue}
          duration={0.82}
          suffix=" đ"
          formatter={membershipPriceFormatter}
          playKey={playKey}
          className="tabular-nums"
        />
        <span className="ml-1 text-sm font-semibold text-slate-300">
          / tháng
        </span>
      </p>
      <button
        type="button"
        className={cn(
          "mt-5 h-12 w-full rounded-xl border px-4 text-sm font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 active:translate-y-0",
          plan.buttonClassName,
        )}
      >
        {plan.button}
      </button>
      <ul className="mt-5 space-y-2.5 text-left">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex min-w-0 items-start gap-2 text-[13px] font-medium leading-5 text-slate-200"
          >
            <CheckCircle2
              className={cn("mt-0.5 h-4 w-4 shrink-0", plan.accent)}
            />
            <span>
              <AnimatedFeatureText
                text={feature}
                playKey={`${playKey}-${feature}`}
              />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto" />
    </div>
  </motion.article>
  );
};

const MembershipInfoBar = () => (
  <section className="grid gap-4 rounded-3xl border border-blue-300/18 bg-[linear-gradient(135deg,rgba(8,23,55,0.88),rgba(17,18,55,0.92))] p-5 shadow-[0_20px_54px_rgba(2,8,23,0.28)] lg:grid-cols-[1.45fr_repeat(3,minmax(0,1fr))]">
    {infoBlocks.map((item, index) => (
      <div
        key={item.title}
        className={cn(
          "flex min-w-0 items-center gap-4",
          index > 0 && "lg:border-l lg:border-white/8 lg:pl-6",
        )}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
          <item.icon className={cn("h-7 w-7", item.iconClassName)} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-black text-white">{item.title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-300">
            {item.description}
          </p>
        </div>
      </div>
    ))}
  </section>
);

export const MembershipUpgradeContent: React.FC<{
  transition: UpgradeModeTransition;
  billingCycle?: BillingCycle;
}> = ({ transition, billingCycle = "yearly" }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
  <section
    className="mt-6 min-w-0"
    aria-busy={transition.isTransitioning}
  >
    <motion.section
      variants={cardContainerVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      className="grid items-stretch gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {plans.map((plan) => (
        <motion.div
          key={plan.id}
          variants={cardItemVariants}
          className="h-full min-w-0"
        >
          <MembershipPlanCard plan={plan} billingCycle={billingCycle} />
        </motion.div>
      ))}
    </motion.section>

    <motion.div
      variants={upgradeSectionVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      className="mt-8"
    >
      <MembershipInfoBar />
    </motion.div>
  </section>
  );
};

export const MembershipPackagesPage: React.FC = () => {
  const [billingCycle, setBillingCycle] =
    React.useState<BillingCycle>("yearly");
  const transition = useUpgradeModeTransition();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(50,65,150,0.14),transparent_38%),linear-gradient(180deg,#020817_0%,#031127_55%,#020817_100%)] text-white">
      <UpgradeThemeGlow mode={transition.visualMode} phase={transition.phase} />
      <div className="relative z-10 mx-auto w-[min(calc(100%_-_40px),1720px)] pb-8 pt-5 [@media(max-height:820px)]:pb-6 [@media(max-height:820px)]:pt-4">
        <MembershipHeader
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          transition={transition}
        />

        <motion.div {...transition.pageMotionProps}>
          <MembershipUpgradeContent
            transition={transition}
            billingCycle={billingCycle}
          />
        </motion.div>
      </div>
    </main>
  );
};
