import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Crown,
  Gamepad2,
  Gem,
  Gift,
  History,
  Info,
  Minus,
  Plane,
  Plus,
  RotateCw,
  Sparkles,
  Star,
  Ticket,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import coinImage from "@/assets/images/coin.png";
import coinGoldImage from "@/assets/images/coin-gold.png";
import giftboxImage from "@/assets/images/giftbox.png";
import chestCommon from "@/assets/images/lucky-wheel/chests/chest-common.png";
import chestSilver from "@/assets/images/lucky-wheel/chests/chest-silver.png";
import chestGold from "@/assets/images/lucky-wheel/chests/chest-gold.png";
import chestPremium from "@/assets/images/lucky-wheel/chests/chest-premium.png";
import chestJackpot from "@/assets/images/lucky-wheel/chests/chest-jackpot.png";

export const luckyWheelChestAssets = {
  common: chestCommon,
  silver: chestSilver,
  gold: chestGold,
  premium: chestPremium,
  jackpot: chestJackpot,
} as const;

type WheelRewardType =
  | "ai-coins"
  | "special-coins"
  | "voucher"
  | "chest"
  | "free-spin";

type WheelReward = {
  id: string;
  label: string;
  shortLabel: string;
  type: WheelRewardType;
  value?: number;
  color: string;
  icon: React.ElementType;
  image?: string;
};

type DailyMission = {
  id: string;
  title: string;
  progress: number;
  target: number;
  rewardSpins: number;
  completed: boolean;
  claimed: boolean;
  icon: React.ElementType;
};

type ModalKind = "history" | "rules" | null;

const SPIN_PRICE = 500;
const MAX_SPINS = 10;
const SEGMENT_DEGREES = 45;

const demoWallet = {
  aiCoins: 125_680,
  specialCoins: 320,
};

// TODO: Replace demo reward selection with backend-authoritative spin results.
const wheelRewards: WheelReward[] = [
  {
    id: "coins-10000",
    label: "10.000 AI Coins",
    shortLabel: "10.000",
    type: "ai-coins",
    value: 10_000,
    color: "#d97706",
    icon: Sparkles,
    image: coinGoldImage,
  },
  {
    id: "special-coins-100",
    label: "100 Special Coins",
    shortLabel: "100",
    type: "special-coins",
    value: 100,
    color: "#6d28d9",
    icon: Gem,
    image: coinImage,
  },
  {
    id: "voucher-20",
    label: "Voucher giảm 20%",
    shortLabel: "Voucher",
    type: "voucher",
    value: 20,
    color: "#1d4ed8",
    icon: Ticket,
  },
  {
    id: "premium-chest",
    label: "Rương cao cấp",
    shortLabel: "Rương",
    type: "chest",
    color: "#4c1d95",
    icon: Gift,
    image: luckyWheelChestAssets.premium,
  },
  {
    id: "coins-5000",
    label: "5.000 AI Coins",
    shortLabel: "5.000",
    type: "ai-coins",
    value: 5_000,
    color: "#b45309",
    icon: Sparkles,
    image: coinGoldImage,
  },
  {
    id: "voucher-10",
    label: "Voucher giảm 10%",
    shortLabel: "Voucher",
    type: "voucher",
    value: 10,
    color: "#581c87",
    icon: Ticket,
  },
  {
    id: "free-spin",
    label: "+1 lượt quay",
    shortLabel: "+1 lượt",
    type: "free-spin",
    value: 1,
    color: "#1e40af",
    icon: Plane,
  },
  {
    id: "coins-20000",
    label: "20.000 AI Coins",
    shortLabel: "20.000",
    type: "ai-coins",
    value: 20_000,
    color: "#7c2d12",
    icon: Sparkles,
    image: coinGoldImage,
  },
];

const wheelGradient = `conic-gradient(from -22.5deg, ${wheelRewards
  .map((reward, index) => {
    const start = index * SEGMENT_DEGREES;
    const end = start + SEGMENT_DEGREES;
    return `${reward.color} ${start}deg ${end}deg`;
  })
  .join(", ")})`;

const dailyMissions: DailyMission[] = [
  {
    id: "login",
    title: "Đăng nhập mỗi ngày",
    progress: 1,
    target: 1,
    rewardSpins: 1,
    completed: true,
    claimed: true,
    icon: CheckCircle2,
  },
  {
    id: "ai-travel",
    title: "Đặt lịch AI Travel",
    progress: 0,
    target: 1,
    rewardSpins: 1,
    completed: false,
    claimed: false,
    icon: Plane,
  },
  {
    id: "share",
    title: "Chia sẻ với bạn bè",
    progress: 0,
    target: 1,
    rewardSpins: 1,
    completed: false,
    claimed: false,
    icon: Star,
  },
  {
    id: "mini-game",
    title: "Tham gia Mini Game",
    progress: 0,
    target: 2,
    rewardSpins: 1,
    completed: false,
    claimed: false,
    icon: Gamepad2,
  },
];

const leaderboard = [
  { rank: 1, name: "TravelerVIP", reward: 2_560_000, initials: "TV" },
  { rank: 2, name: "OceanMaster", reward: 1_860_500, initials: "OM" },
  { rank: 3, name: "GlobeTrotter", reward: 1_250_700, initials: "GT" },
  { rank: 4, name: "Wanderlust", reward: 965_300, initials: "WL" },
  { rank: 5, name: "DreamFlyer", reward: 754_200, initials: "DF" },
];

const recentResults = [
  "TravelerVIP nhận 20.000 AI Coins",
  "OceanMaster nhận Voucher giảm 20%",
  "GlobeTrotter nhận Rương cao cấp",
  "DreamFlyer nhận +1 lượt quay",
];

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

const Panel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <section
    className={cn(
      "rounded-[26px] border border-violet-400/24 bg-[linear-gradient(180deg,rgba(26,13,62,0.86),rgba(8,12,38,0.94))] p-5 shadow-[0_24px_60px_rgba(5,8,25,0.34),inset_0_1px_0_rgba(255,255,255,0.06)]",
      className,
    )}
  >
    {children}
  </section>
);

const PanelTitle: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}> = ({ icon: Icon, title, subtitle }) => (
  <header className="mb-4 flex items-start gap-3">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/16 text-amber-300 shadow-[0_0_20px_rgba(168,85,247,0.18)]">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-black uppercase tracking-wide text-white">
        {title}
      </span>
      {subtitle ? (
        <span className="mt-1 block text-xs font-semibold leading-5 text-violet-100/70">
          {subtitle}
        </span>
      ) : null}
    </span>
  </header>
);

const DailyMissionsPanel = () => (
  <Panel>
    <PanelTitle
      icon={Gift}
      title="Nhiệm vụ hằng ngày"
      subtitle="Hoàn thành nhiệm vụ để nhận thêm lượt quay"
    />
    <div className="space-y-3">
      {dailyMissions.map((mission) => {
        const Icon = mission.icon;
        return (
          <div
            key={mission.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/14 text-amber-300">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">
                {mission.title}
              </span>
              <span className="mt-1 flex items-center gap-3 text-xs font-semibold text-violet-100/72">
                <span>
                  {mission.progress}/{mission.target}
                </span>
                <span className="text-amber-300">+{mission.rewardSpins} lượt</span>
              </span>
            </span>
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-2 text-xs font-black transition-colors focus:outline-none focus:ring-2 focus:ring-violet-300",
                mission.claimed
                  ? "bg-emerald-400/14 text-emerald-200"
                  : "bg-violet-500/30 text-white hover:bg-violet-400/40",
              )}
            >
              {mission.claimed ? "Đã nhận" : mission.completed ? "Nhận" : "Đi ngay"}
            </button>
          </div>
        );
      })}
    </div>
    <div className="mt-4 rounded-2xl bg-[linear-gradient(135deg,rgba(124,58,237,0.26),rgba(245,158,11,0.14))] p-4">
      <div className="flex items-center gap-3">
        <img
          src={luckyWheelChestAssets.common}
          alt="Daily Mission Chest"
          className="shrink-0 h-[48px] w-[48px] object-contain drop-shadow-md"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = giftboxImage;
          }}
        />
        <div>
          <p className="text-base font-black text-white">Quay mỗi ngày</p>
          <p className="text-sm font-semibold text-violet-100/80">
            Quà liền tay!
          </p>
        </div>
      </div>
    </div>
  </Panel>
);

const LeaderboardPanel = () => (
  <Panel>
    <PanelTitle icon={Trophy} title="Top người may mắn" />
    <div className="space-y-3">
      {leaderboard.map((entry) => (
        <div
          key={entry.rank}
          className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-3"
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black",
              entry.rank === 1
                ? "bg-amber-400 text-slate-950"
                : entry.rank === 2
                  ? "bg-slate-200 text-slate-950"
                  : entry.rank === 3
                    ? "bg-orange-400 text-slate-950"
                    : "bg-white/10 text-white",
            )}
          >
            {entry.rank}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 text-xs font-black text-white">
            {entry.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">
              {entry.name}
            </span>
            <span className="flex items-center gap-1 text-xs font-black text-amber-300">
              <img src={coinGoldImage} alt="" className="h-4 w-4" draggable={false} />
              {formatNumber(entry.reward)}
            </span>
          </span>
        </div>
      ))}
    </div>
    <button
      type="button"
      className="mt-5 h-11 w-full rounded-full border border-violet-300/35 bg-violet-500/18 text-sm font-black text-white transition-colors hover:bg-violet-400/28 focus:outline-none focus:ring-2 focus:ring-violet-300"
    >
      Xem bảng xếp hạng
    </button>
  </Panel>
);

const JackpotPanel = () => (
  <Panel>
    <PanelTitle icon={Crown} title="Jackpot hôm nay" />
    <img
      src={luckyWheelChestAssets.jackpot}
      alt="Jackpot Chest"
      className="jackpot-chest"
      draggable={false}
      onError={(e) => {
        (e.target as HTMLImageElement).src = giftboxImage;
        console.warn("Jackpot chest image failed to load, falling back to default giftbox.");
      }}
    />
    <div className="mt-2 text-center">
      <p className="text-4xl font-black tracking-tight text-amber-300">
        1.250.000
      </p>
      <p className="mt-1 text-lg font-black text-white">AI Coins</p>
      <p className="mt-3 text-sm font-semibold text-violet-100/76">
        Cơ hội trúng Jackpot mỗi ngày!
      </p>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-violet-300/18 bg-black/18 p-3 text-center">
      {[
        ["08", "Giờ"],
        ["24", "Phút"],
        ["36", "Giây"],
      ].map(([value, label]) => (
        <span key={label}>
          <span className="block text-2xl font-black text-white">{value}</span>
          <span className="text-xs font-semibold text-violet-100/65">{label}</span>
        </span>
      ))}
    </div>
  </Panel>
);

const SpecialRewardsPanel = () => {
  const specialChests = [
    luckyWheelChestAssets.common,
    luckyWheelChestAssets.silver,
    luckyWheelChestAssets.gold,
    luckyWheelChestAssets.premium,
  ];

  return (
    <Panel>
      <PanelTitle icon={Sparkles} title="Phần thưởng đặc biệt" />
      <div className="grid grid-cols-4 gap-3 text-center">
        {[5, 10, 20, 50].map((milestone, index) => {
          const size = index === 0 ? "24px" : index === 1 ? "28px" : index === 2 ? "32px" : "40px";
          return (
            <span key={milestone} className="min-w-0">
              <span
                className={cn(
                  "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border bg-white/[0.05]",
                  index === 3
                    ? "border-amber-300/55 text-amber-300"
                    : "border-violet-300/20 text-violet-100",
                )}
              >
                <img
                  src={specialChests[index] || giftboxImage}
                  alt={`Chest ${milestone}`}
                  className="object-contain pointer-events-none select-none drop-shadow-md"
                  style={{ width: size, height: size }}
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = giftboxImage;
                  }}
                />
              </span>
              <span className="mt-2 block text-sm font-black text-white">{milestone}</span>
              <span className="block text-xs font-semibold text-violet-100/66">lượt</span>
            </span>
          );
        })}
      </div>
    </Panel>
  );
};

const FreeSpinPanel: React.FC = () => {
  const [claimed, setClaimed] = React.useState(false);

  return (
    <Panel>
      <PanelTitle icon={Clock3} title="Lượt quay miễn phí" />
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/45 bg-amber-400/12 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.18)]">
          <RotateCw className="h-9 w-9" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-violet-100/78">
            Quay miễn phí mỗi ngày
          </span>
          <span className="mt-2 block text-2xl font-black text-amber-300">
            23:59:59
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setClaimed(true)}
        disabled={claimed}
        className={cn(
          "mt-5 h-11 w-full rounded-full text-sm font-black transition-colors focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed",
          claimed
            ? "bg-white/10 text-violet-100/58"
            : "bg-[linear-gradient(135deg,#7c3aed,#db2777)] text-white hover:brightness-110",
        )}
      >
        {claimed ? "Đã nhận hôm nay" : "Nhận lượt miễn phí"}
      </button>
    </Panel>
  );
};

const LuckyWheel: React.FC<{
  rotation: number;
  isSpinning: boolean;
  winningIndex: number | null;
  onSpin: () => void;
  disabled: boolean;
}> = ({ rotation, isSpinning, winningIndex, onSpin, disabled }) => (
  <div className="relative mx-auto w-[min(86vw,660px)] max-w-full">
    <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-5">
      <div className="h-0 w-0 border-x-[24px] border-t-[42px] border-x-transparent border-t-violet-300 drop-shadow-[0_0_18px_rgba(216,180,254,0.9)]" />
    </div>
    <div className="relative aspect-square rounded-full border-[12px] border-amber-400 bg-amber-400/20 p-4 shadow-[0_0_50px_rgba(245,158,11,0.34),0_0_90px_rgba(168,85,247,0.26)]">
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_12px_rgba(253,230,138,0.92)]"
          style={{
            transform: `translate(-50%, -50%) rotate(${index * 22.5}deg) translateY(calc(-1 * (min(43vw, 330px) - 12px)))`,
          }}
        />
      ))}
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-full border-4 border-violet-500/70 shadow-inner"
        style={{ background: wheelGradient }}
        animate={{ rotate: rotation }}
        transition={{
          duration: isSpinning ? 5.2 : 0,
          ease: [0.12, 0.72, 0.12, 1],
        }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_0_27%,rgba(5,8,24,0.2)_28%,transparent_31%,rgba(255,255,255,0.08)_100%)]" />
        {wheelRewards.map((reward, index) => {
          const Icon = reward.icon;
          const angle = index * SEGMENT_DEGREES + SEGMENT_DEGREES / 2;
          const isWinner = winningIndex === index && !isSpinning;

          return (
            <div
              key={reward.id}
              className="absolute left-1/2 top-1/2 h-1/2 w-[34%] origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${angle}deg)`,
              }}
            >
              <div
                className={cn(
                  "absolute left-1/2 top-7 flex w-28 -translate-x-1/2 flex-col items-center text-center text-white transition-transform",
                  isWinner && "scale-110",
                )}
                style={{ transform: `rotate(${-angle}deg)` }}
              >
                {reward.image ? (
                  <img
                    src={reward.image}
                    alt=""
                    className={cn(
                      reward.type === "chest"
                        ? "wheel-reward-chest"
                        : "h-14 w-16 object-contain pointer-events-none select-none drop-shadow-[0_0_14px_rgba(255,255,255,0.24)]"
                    )}
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = giftboxImage;
                      console.warn(`Failed to load reward image for: ${reward.id}`);
                    }}
                  />
                ) : (
                  <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.14]">
                    <Icon className="h-9 w-9" aria-hidden="true" />
                  </span>
                )}
                <span className="mt-1 text-lg font-black leading-none drop-shadow">
                  {reward.shortLabel}
                </span>
                <span className="mt-1 text-xs font-bold leading-tight text-white/86">
                  {reward.type === "ai-coins"
                    ? "AI Coins"
                    : reward.type === "special-coins"
                      ? "Special Coins"
                      : reward.type === "voucher"
                        ? `giảm ${reward.value}%`
                        : reward.type === "free-spin"
                          ? "lượt quay"
                          : "Cao cấp"}
                </span>
              </div>
            </div>
          );
        })}
      </motion.div>
      <button
        type="button"
        onClick={onSpin}
        disabled={disabled || isSpinning}
        className="absolute left-1/2 top-1/2 z-30 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-amber-200 bg-[radial-gradient(circle,#db2777,#6d28d9_72%)] text-center text-3xl font-black leading-none text-amber-100 shadow-[0_0_35px_rgba(217,70,239,0.7),inset_0_0_28px_rgba(255,255,255,0.12)] transition-transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-75"
        aria-label="Quay ngay"
      >
        {isSpinning ? (
          <RotateCw className="h-12 w-12 animate-spin" aria-hidden="true" />
        ) : (
          <span>
            QUAY
            <br />
            NGAY
          </span>
        )}
      </button>
    </div>
  </div>
);

const SpinControls: React.FC<{
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  totalCost: number;
  insufficientBalance: boolean;
  isSpinning: boolean;
  onSpin: () => void;
}> = ({
  quantity,
  setQuantity,
  totalCost,
  insufficientBalance,
  isSpinning,
  onSpin,
}) => (
  <div className="mx-auto mt-5 grid w-full max-w-3xl gap-4 rounded-[28px] border border-violet-400/24 bg-[linear-gradient(135deg,rgba(37,16,76,0.86),rgba(10,14,45,0.96))] p-4 shadow-[0_22px_50px_rgba(5,8,24,0.3)] md:grid-cols-[1fr_1fr_1.25fr] md:items-center">
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-violet-100/70">
        Số lượng quay
      </p>
      <div className="mt-2 flex h-12 items-center justify-between rounded-full border border-violet-300/30 bg-black/18 px-2">
        <button
          type="button"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          disabled={quantity <= 1 || isSpinning}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/28 text-white transition-colors hover:bg-violet-400/38 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-45"
          aria-label="Giảm số lượt quay"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-2xl font-black text-white">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((value) => Math.min(MAX_SPINS, value + 1))}
          disabled={quantity >= MAX_SPINS || isSpinning}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/28 text-white transition-colors hover:bg-violet-400/38 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-45"
          aria-label="Tăng số lượt quay"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-violet-100/70">
        Giá mỗi lượt
      </p>
      <p className="mt-1 flex items-baseline gap-2 text-4xl font-black text-amber-300">
        {formatNumber(SPIN_PRICE)}
        <span className="text-sm font-bold text-violet-100/72">AI Coins</span>
      </p>
      <p className="mt-1 text-sm font-semibold text-violet-100/72">
        Bạn có: <span className="font-black text-amber-300">{formatNumber(demoWallet.aiCoins)}</span>
      </p>
    </div>
    <div>
      <button
        type="button"
        onClick={onSpin}
        disabled={isSpinning || insufficientBalance}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#a855f7,#db2777)] text-lg font-black text-white shadow-[0_0_28px_rgba(168,85,247,0.42)] transition-transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {isSpinning ? <RotateCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        {insufficientBalance ? "Không đủ AI Coins" : `Quay ngay (${formatNumber(totalCost)})`}
      </button>
    </div>
  </div>
);

const InfoModal: React.FC<{
  kind: ModalKind;
  onClose: () => void;
}> = ({ kind, onClose }) => (
  <AnimatePresence>
    {kind ? (
      <motion.div
        className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/72 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-lg rounded-[28px] border border-violet-300/28 bg-[linear-gradient(180deg,#1b1045,#081129)] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.44)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-black">
                {kind === "history" ? "Lịch sử quay" : "Thể lệ vòng quay"}
              </p>
              <p className="mt-1 text-sm font-semibold text-violet-100/72">
                {kind === "history"
                  ? "Kết quả demo gần đây trong cộng đồng."
                  : "Luật chơi hiện là mô phỏng giao diện, chưa tạo giao dịch thật."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-violet-300"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {(kind === "history"
              ? recentResults
              : [
                  "Mỗi lượt quay demo có giá 500 AI Coins.",
                  "Phần thưởng sản xuất cần được xác nhận bởi backend.",
                  "Frontend chỉ hiển thị hiệu ứng và kết quả mô phỏng.",
                  "Không có số dư nào bị trừ trong trang demo này.",
                ]
            ).map((line) => (
              <div
                key={line}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm font-semibold text-violet-50"
              >
                {line}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

const ResultModal: React.FC<{
  reward: WheelReward | null;
  onClose: () => void;
  onSpinAgain: () => void;
  canSpinAgain: boolean;
}> = ({ reward, onClose, onSpinAgain, canSpinAgain }) => (
  <AnimatePresence>
    {reward ? (
      <motion.div
        className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/75 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-wheel-result-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-amber-300/40 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.26),transparent_42%),linear-gradient(180deg,#241047,#080d25)] p-7 text-center text-white shadow-[0_28px_100px_rgba(0,0,0,0.48),0_0_46px_rgba(245,158,11,0.22)]"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-amber-200"
            aria-label="Đóng kết quả"
          >
            <X className="h-5 w-5" />
          </button>
          <Sparkles className="mx-auto h-10 w-10 text-amber-300" aria-hidden="true" />
          <h2 id="lucky-wheel-result-title" className="mt-3 text-3xl font-black text-amber-200">
            Chúc mừng!
          </h2>
          <p className="mt-2 text-sm font-semibold text-violet-100/76">
            Bạn nhận được:
          </p>
          {reward.image ? (
            <img
              src={reward.image}
              alt=""
              className="mx-auto mt-3 h-20 w-24 object-contain"
              draggable={false}
            />
          ) : null}
          <p className="mt-3 text-2xl font-black text-white" aria-live="polite">
            {reward.label}
          </p>
          <p className="mt-3 text-xs font-semibold leading-5 text-violet-100/64">
            Đây là kết quả demo giao diện. Backend cần xác nhận phần thưởng trước khi cộng vào ví.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-2xl border border-white/[0.15] bg-white/[0.08] text-sm font-black text-white hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={onSpinAgain}
              disabled={!canSpinAgain}
              className="h-12 rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#db2777)] text-sm font-black text-white shadow-[0_0_22px_rgba(245,158,11,0.28)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-55"
            >
              Quay tiếp
            </button>
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export const LuckyWheelPage: React.FC = () => {
  const [quantity, setQuantity] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [winningIndex, setWinningIndex] = React.useState<number | null>(null);
  const [resultReward, setResultReward] = React.useState<WheelReward | null>(null);
  const [modalKind, setModalKind] = React.useState<ModalKind>(null);
  const spinCountRef = React.useRef(0);
  const spinTimeoutRef = React.useRef<number | null>(null);

  const totalCost = quantity * SPIN_PRICE;
  const insufficientBalance = totalCost > demoWallet.aiCoins;

  React.useEffect(
    () => () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalKind(null);
        setResultReward(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const startSpin = React.useCallback(() => {
    if (isSpinning || insufficientBalance) {
      return;
    }

    const nextIndex = (spinCountRef.current + quantity + 2) % wheelRewards.length;
    const currentRotation = ((rotation % 360) + 360) % 360;
    const targetCenter = nextIndex * SEGMENT_DEGREES + SEGMENT_DEGREES / 2;
    const rotationToTarget = 360 - targetCenter;
    const adjustment = (rotationToTarget - currentRotation + 360) % 360;
    const fullRotations = 360 * (6 + (spinCountRef.current % 2));
    const finalRotation = rotation + fullRotations + adjustment;

    setIsSpinning(true);
    setWinningIndex(null);
    setResultReward(null);
    setRotation(finalRotation);
    spinCountRef.current += 1;

    spinTimeoutRef.current = window.setTimeout(() => {
      setIsSpinning(false);
      setWinningIndex(nextIndex);
      setResultReward(wheelRewards[nextIndex]);
    }, 5300);
  }, [insufficientBalance, isSpinning, quantity, rotation]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.18),transparent_34%),radial-gradient(circle_at_8%_72%,rgba(245,158,11,0.10),transparent_26%),linear-gradient(180deg,#070618_0%,#0b0630_48%,#050817_100%)] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(217,70,239,0.12),transparent_24%),radial-gradient(circle_at_74%_18%,rgba(245,158,11,0.08),transparent_22%)]" />
      <div className="relative mx-auto w-[min(100%,1760px)]">
        <div className="mb-5 flex flex-col items-center gap-4 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="lg:w-72" />
          <div className="min-w-0">
            <h1 className="text-4xl font-black tracking-tight text-transparent drop-shadow-[0_0_20px_rgba(217,70,239,0.45)] [background:linear-gradient(135deg,#fde68a,#f59e0b,#f0abfc)] [-webkit-background-clip:text] sm:text-5xl lg:text-6xl">
              VÒNG QUAY ĐỘC QUYỀN
            </h1>
            <p className="mt-3 text-xl font-black text-white">
              <span className="text-amber-300">✦</span> Quay ngay – Rinh quà cực hay! <span className="text-amber-300">✦</span>
            </p>
          </div>
          <div className="flex w-full justify-center gap-3 lg:w-72 lg:justify-end">
            <button
              type="button"
              onClick={() => setModalKind("history")}
              className="flex h-12 items-center gap-2 rounded-full border border-violet-300/35 bg-violet-500/14 px-5 text-sm font-black text-white transition-colors hover:bg-violet-400/22 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              <History className="h-4 w-4" />
              Lịch sử quay
            </button>
            <button
              type="button"
              onClick={() => setModalKind("rules")}
              className="flex h-12 items-center gap-2 rounded-full border border-violet-300/35 bg-violet-500/14 px-5 text-sm font-black text-white transition-colors hover:bg-violet-400/22 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              <Info className="h-4 w-4" />
              Thể lệ
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(250px,0.72fr)_minmax(560px,1.8fr)_minmax(250px,0.72fr)] xl:items-start">
          <aside className="order-2 grid gap-5 md:grid-cols-2 xl:order-1 xl:grid-cols-1">
            <DailyMissionsPanel />
            <LeaderboardPanel />
          </aside>

          <section className="order-1 xl:order-2">
            <LuckyWheel
              rotation={rotation}
              isSpinning={isSpinning}
              winningIndex={winningIndex}
              onSpin={startSpin}
              disabled={insufficientBalance}
            />
            
            <div className="relative z-10 -mt-16 mb-8 flex items-end justify-center gap-4">
              <img
                src={luckyWheelChestAssets.silver}
                alt="Silver Chest"
                className="h-[100px] w-[100px] object-contain drop-shadow-xl"
                draggable={false}
              />
              <img
                src={luckyWheelChestAssets.jackpot}
                alt="Jackpot Chest"
                className="z-10 -mb-2 h-[160px] w-[160px] object-contain drop-shadow-[0_0_24px_rgba(245,158,11,0.5)]"
                draggable={false}
              />
              <img
                src={luckyWheelChestAssets.gold}
                alt="Gold Chest"
                className="h-[100px] w-[100px] object-contain drop-shadow-xl"
                draggable={false}
              />
            </div>

            <SpinControls
              quantity={quantity}
              setQuantity={setQuantity}
              totalCost={totalCost}
              insufficientBalance={insufficientBalance}
              isSpinning={isSpinning}
              onSpin={startSpin}
            />
            <div className="mx-auto mt-4 flex max-w-3xl flex-col items-center justify-between gap-3 rounded-full border border-violet-300/22 bg-violet-500/12 px-5 py-3 text-center sm:flex-row sm:text-left">
              <span className="flex items-center gap-3 text-sm font-semibold text-violet-50">
                <Gift className="h-5 w-5 text-fuchsia-300" />
                Mua gói lượt quay để nhận ưu đãi lên đến 30%
              </span>
              <button
                type="button"
                className="h-10 rounded-full border border-violet-300/35 px-5 text-sm font-black text-white hover:bg-violet-400/20 focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                Xem gói ưu đãi
              </button>
            </div>
          </section>

          <aside className="order-3 grid gap-5 md:grid-cols-3 xl:grid-cols-1">
            <JackpotPanel />
            <SpecialRewardsPanel />
            <FreeSpinPanel />
          </aside>
        </div>
      </div>

      <InfoModal kind={modalKind} onClose={() => setModalKind(null)} />
      <ResultModal
        reward={resultReward}
        onClose={() => setResultReward(null)}
        onSpinAgain={() => {
          setResultReward(null);
          startSpin();
        }}
        canSpinAgain={!insufficientBalance && !isSpinning}
      />
    </main>
  );
};

export default LuckyWheelPage;
