import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  Gamepad2,
  Gift,
  History,
  LockKeyhole,
  Medal,
  Plane,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { demoRewardWallet } from "./rewardData";
import { missionAssets } from "./missionAssets";
import { MissionsMobilePresentation } from "./MissionsMobilePresentation";
import { createMissionsMotion, missionsEase } from "./missionsMotion";
import {
  dailyCheckInItems,
  demoMissionSummary,
  missionItems,
  missionLeaderboard,
  seasonMilestones,
  type MissionCategory,
  type MissionIconName,
  type MissionItem,
} from "./missionData";
import "./MissionsPage.css";

const categoryTabs: Array<{ id: MissionCategory; label: string }> = [
  { id: "daily", label: "Daily Missions" },
  { id: "weekly", label: "Weekly Missions" },
  { id: "monthly", label: "Monthly Missions" },
  { id: "special", label: "Special Missions" },
  { id: "events", label: "Events" },
];

const missionIcons: Record<MissionIconName, React.ElementType> = {
  calendar: CalendarCheck2,
  game: Gamepad2,
  tasks: Target,
  share: Share2,
  marketplace: ShoppingBag,
  sparkles: Sparkles,
  plane: Plane,
  trophy: Trophy,
};

const missionActionAssets: Partial<Record<MissionIconName, string>> = {
  calendar: missionAssets.missionActions.dailyLogin,
  game: missionAssets.missionActions.miniGame,
  tasks: missionAssets.missionActions.completeMissions,
  share: missionAssets.missionActions.shareWebsite,
  marketplace: missionAssets.missionActions.marketplace,
};

const milestoneAssets: Partial<Record<number, string>> = {
  15: missionAssets.seasonMilestones.current,
  20: missionAssets.seasonMilestones.silver,
  30: missionAssets.seasonMilestones.locked,
  50: missionAssets.seasonMilestones.final,
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

const ProgressBar: React.FC<{
  value: number;
  max: number;
  label: string;
  tone?: "violet" | "green";
}> = ({ value, max, label, tone = "violet" }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const ratio = Math.min(value / Math.max(max, 1), 1);

  return (
    <div
      className="missions-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <motion.span
        className={`missions-progress__fill missions-progress__fill--${tone}`}
        initial={shouldReduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: ratio }}
        style={{ transformOrigin: "left" }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: missionsEase }}
      />
    </div>
  );
};

const CardTitle: React.FC<{
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon: Icon, children, action }) => (
  <div className="missions-card-title">
    <span>
      <Icon aria-hidden="true" />
      <strong>{children}</strong>
    </span>
    {action}
  </div>
);

const MissionsHero: React.FC<{ onHistory: () => void }> = ({ onHistory }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionConfig = createMissionsMotion(shouldReduceMotion);

  return <motion.section
    className="missions-hero"
    aria-labelledby="missions-title"
    variants={motionConfig.section}
  >
    <motion.img
      src={missionAssets.heroChest}
      alt=""
      aria-hidden="true"
      className="missions-hero__art"
      variants={motionConfig.heroArt}
    />
    <motion.div className="missions-hero__copy" variants={motionConfig.section}>
      <div className="missions-hero__sparkles" aria-hidden="true">
        <Sparkles />
        <span />
        <Sparkles />
      </div>
      <h1 id="missions-title">MISSIONS</h1>
      <p>
        Complete daily missions and earn Special Coins and exclusive rewards!
      </p>
    </motion.div>
    <motion.button
      type="button"
      className="missions-history-button"
      onClick={onHistory}
      variants={motionConfig.section}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
    >
      <History aria-hidden="true" />
      Mission History
    </motion.button>
  </motion.section>;
};

const MissionsSummary = () => {
  const motionConfig = createMissionsMotion(Boolean(useReducedMotion()));
  const metrics = [
    {
      label: "Your Special Coins",
      value: formatNumber(demoRewardWallet.specialCoins),
      suffix: "",
      accent: true,
    },
    {
      label: "Season EXP",
      value: formatNumber(demoMissionSummary.seasonExp),
      suffix: ` / ${formatNumber(demoMissionSummary.seasonExpTarget)} EXP`,
    },
    {
      label: "Missions Completed",
      value: `${demoMissionSummary.completedMissions}`,
      suffix: ` / ${demoMissionSummary.totalMissions}`,
    },
    {
      label: "Login Streak",
      value: `${demoMissionSummary.loginStreakDays}`,
      suffix: " days",
      accent: true,
    },
  ];

  return (
    <motion.section
      className="missions-summary"
      aria-label="Mission summary"
      variants={motionConfig.section}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="missions-summary__metric">
          <span>{metric.label}</span>
          <strong className={metric.accent ? "is-accent" : ""}>
            {metric.value}
            {metric.label === "Your Special Coins" && (
              <img src={missionAssets.specialCoin} alt="Special Coin" />
            )}
            <small>{metric.suffix}</small>
          </strong>
        </div>
      ))}
    </motion.section>
  );
};

const SeasonProgress = () => {
  const motionConfig = createMissionsMotion(Boolean(useReducedMotion()));

  return <motion.section
    className="missions-card season-progress-card"
    variants={motionConfig.section}
  >
    <span className="season-progress-card__countdown" aria-label="Season ends in 24 days">
      Season ends in: <strong>24 days 18:32:10</strong>
    </span>
    <div className="season-level">
      <img
        src={missionAssets.seasonLevelBadge}
        alt={`Season level ${demoMissionSummary.seasonLevel}`}
        className="season-level__badge"
      />
      <div>
        <strong>SEASON LEVEL {demoMissionSummary.seasonLevel}</strong>
        <p>
          EXP <b>{formatNumber(demoMissionSummary.seasonExp)}</b> /{" "}
          {formatNumber(demoMissionSummary.seasonExpTarget)}
        </p>
        <ProgressBar
          value={demoMissionSummary.seasonExp}
          max={demoMissionSummary.seasonExpTarget}
          label="Season EXP progress"
        />
      </div>
    </div>

    <div className="season-milestones" aria-label="Season reward milestones">
      {seasonMilestones.map((milestone) => (
        <div
          key={milestone.level}
          className={`season-milestone season-milestone--${milestone.state}`}
        >
          <span className={`season-milestone__icon ${milestoneAssets[milestone.level] ? "has-image" : ""}`}>
            {milestoneAssets[milestone.level] ? (
              <img
                src={milestoneAssets[milestone.level]}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
            ) : milestone.state === "completed" ? (
              <Check aria-hidden="true" />
            ) : milestone.final ? (
              <Gift aria-hidden="true" />
            ) : milestone.state === "locked" ? (
              <LockKeyhole aria-hidden="true" />
            ) : (
              <Gift aria-hidden="true" />
            )}
          </span>
          <strong>{milestone.level}</strong>
          <small>
            <img src={missionAssets.specialCoin} alt="" aria-hidden="true" />
            {formatNumber(milestone.rewardCoins)}
          </small>
        </div>
      ))}
    </div>
  </motion.section>;
};

const MissionRow: React.FC<{
  mission: MissionItem;
  onAction: (mission: MissionItem) => void;
}> = ({ mission, onAction }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionConfig = createMissionsMotion(shouldReduceMotion);
  const Icon = missionIcons[mission.icon];
  const iconAsset = missionActionAssets[mission.icon];
  const actionLabel =
    mission.status === "claimed"
      ? "Claimed"
      : mission.status === "locked"
        ? "Locked"
        : mission.actionType === "claim"
          ? "Claim Reward"
          : mission.actionType === "share"
            ? "Share"
            : "Go Now";
  const disabled = mission.status === "claimed" || mission.status === "locked";

  return (
    <motion.article
      className={`mission-row mission-row--${mission.status}`}
      variants={motionConfig.row}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
    >
      <motion.span
        className={`mission-row__icon mission-row__icon--${mission.tone}`}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.025 }}
      >
        {iconAsset ? (
          <img src={iconAsset} alt="" aria-hidden="true" loading="lazy" />
        ) : (
          <Icon aria-hidden="true" />
        )}
      </motion.span>
      <div className="mission-row__copy">
        <strong>{mission.title}</strong>
        <p>{mission.description}</p>
      </div>
      <div className="mission-row__progress">
        <ProgressBar
          value={mission.progress}
          max={mission.target}
          label={`${mission.title} progress`}
          tone={mission.progress >= mission.target ? "violet" : "green"}
        />
        <span>
          {mission.progress} / {mission.target}
        </span>
      </div>
      <strong className="mission-row__reward">
        <img src={missionAssets.specialCoin} alt="Special Coin" />+{mission.rewardCoins}
      </strong>
      <motion.button
        type="button"
        disabled={disabled}
        aria-label={`${actionLabel}: ${mission.title}`}
        className={`mission-row__action ${mission.actionType === "claim" ? "mission-row__action--claim" : ""}`}
        onClick={() => onAction(mission)}
        whileHover={disabled || shouldReduceMotion ? undefined : { y: -1 }}
        whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.975 }}
      >
        {mission.status === "claimed" && (
          <motion.span
            className="mission-action-status-icon"
            initial={shouldReduceMotion ? false : { scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <CheckCircle2 aria-hidden="true" />
          </motion.span>
        )}
        {mission.status === "locked" && <LockKeyhole aria-hidden="true" />}
        {actionLabel}
      </motion.button>
    </motion.article>
  );
};

const VipUpgradeBanner: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionConfig = createMissionsMotion(shouldReduceMotion);

  return <motion.section
    className="vip-upgrade-banner"
    variants={motionConfig.vip}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.35 }}
  >
    <motion.img
      src={missionAssets.vipCard}
      alt="VIP membership card"
      className="vip-upgrade-banner__badge"
      loading="lazy"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
    />
    <div className="vip-upgrade-banner__copy">
      <strong>UPGRADE TO VIP</strong>
      <p>Earn more Special Coins and unlock exclusive mission rewards.</p>
    </div>
    <ul>
      <li><Zap aria-hidden="true" /> +50% Special Coins from missions</li>
      <li><Sparkles aria-hidden="true" /> Exclusive VIP missions</li>
      <li><Gift aria-hidden="true" /> Monthly VIP reward chest</li>
    </ul>
    <motion.button
      type="button"
      onClick={onUpgrade}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
    >
      Upgrade Now <ArrowRight aria-hidden="true" />
    </motion.button>
  </motion.section>;
};

const DailyCheckInCard = () => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionConfig = createMissionsMotion(shouldReduceMotion);

  return <motion.section className="missions-card daily-check-in-card" variants={motionConfig.sidebar}>
    <CardTitle icon={CalendarCheck2}>DAILY CHECK-IN</CardTitle>
    <motion.div className="daily-check-in-grid" variants={motionConfig.checkInList}>
      {dailyCheckInItems.map((item) => (
        <motion.div
          key={item.day}
          className={`daily-check-in-day daily-check-in-day--${item.state}`}
          variants={motionConfig.checkInItem}
        >
          <span>
            {item.state === "claimed" ? (
              <motion.span
                className="daily-check-in-day__check"
                initial={shouldReduceMotion ? false : { scale: 0.75 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                <Check aria-hidden="true" />
              </motion.span>
            ) : (
              <img
                src={item.day === 7 ? missionAssets.checkInDay7Chest : missionAssets.specialCoin}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
            )}
          </span>
          <strong>{item.rewardCoins ? `+${item.rewardCoins}` : item.rewardLabel}</strong>
          <small>Day {item.day}</small>
        </motion.div>
      ))}
    </motion.div>
  </motion.section>;
};

const TodayRewardsCard: React.FC<{ onClaimAll: () => void }> = ({ onClaimAll }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionConfig = createMissionsMotion(shouldReduceMotion);

  return <motion.section className="missions-card today-rewards-card" variants={motionConfig.sidebar}>
    <CardTitle icon={Gift}>TODAY&apos;S REWARDS</CardTitle>
    <div className="today-rewards-card__body">
      <span className="today-rewards-card__amount">
        <img src={missionAssets.specialCoin} alt="Special Coin" />
        <strong>{formatNumber(demoMissionSummary.todayEarnedCoins)}</strong>
        <small>Special Coins earned</small>
      </span>
      <img
        src={missionAssets.todayRewardsChest}
        alt=""
        aria-hidden="true"
        className="today-rewards-card__art"
        loading="lazy"
      />
    </div>
    <motion.button
      type="button"
      onClick={onClaimAll}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
    >
      Claim All
    </motion.button>
  </motion.section>;
};

const MissionsLeaderboardCard: React.FC<{ onViewAll: () => void }> = ({ onViewAll }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionConfig = createMissionsMotion(shouldReduceMotion);

  return <motion.section className="missions-card missions-leaderboard-card" variants={motionConfig.sidebar}>
    <CardTitle
      icon={Trophy}
      action={<button type="button" onClick={onViewAll}>View All <ArrowRight /></button>}
    >
      MISSIONS LEADERBOARD
    </CardTitle>
    <ol>
      {missionLeaderboard.map((entry, index) => (
        <motion.li
          key={entry.id}
          className={entry.currentUser ? "is-current" : ""}
          initial={shouldReduceMotion ? false : { opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.14 : 0.24, delay: shouldReduceMotion ? 0 : index * 0.04 }}
        >
          <motion.span
            className={`missions-rank missions-rank--${entry.rank <= 3 ? entry.rank : "other"}`}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {entry.rank <= 3 ? (
              <img
                src={
                  entry.rank === 1
                    ? missionAssets.leaderboardRanks.gold
                    : entry.rank === 2
                      ? missionAssets.leaderboardRanks.silver
                      : missionAssets.leaderboardRanks.bronze
                }
                alt={`Rank ${entry.rank}`}
                loading="lazy"
              />
            ) : (
              entry.rank
            )}
          </motion.span>
          <span className="missions-avatar">{entry.name.slice(0, 2).toUpperCase()}</span>
          <strong>{entry.name}</strong>
          <span className="missions-leaderboard-card__score">
            {formatNumber(entry.score)} <img src={missionAssets.specialCoin} alt="Special Coin" />
          </span>
        </motion.li>
      ))}
    </ol>
  </motion.section>;
};

const RecentAchievementCard: React.FC<{ onViewAll: () => void }> = ({ onViewAll }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionConfig = createMissionsMotion(shouldReduceMotion);

  return <motion.section className="missions-card recent-achievement-card" variants={motionConfig.sidebar}>
    <CardTitle
      icon={Medal}
      action={<button type="button" onClick={onViewAll}>View All <ArrowRight /></button>}
    >
      RECENT ACHIEVEMENT
    </CardTitle>
    <div className="recent-achievement-card__body">
      <motion.span
        className="recent-achievement-card__badge"
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: shouldReduceMotion ? "tween" : "spring", stiffness: 360, damping: 26 }}
      >
        <img
          src={missionAssets.achievementBadge}
          alt="Dedicated Adventurer achievement badge"
          loading="lazy"
        />
      </motion.span>
      <div>
        <strong>Dedicated Adventurer</strong>
        <p>Complete 10 daily missions</p>
        <ProgressBar value={8} max={10} label="Dedicated Adventurer achievement progress" />
        <small>8 / 10</small>
      </div>
      <b><img src={missionAssets.specialCoin} alt="Special Coin" /> +500</b>
    </div>
  </motion.section>;
};

const MissionsNotice: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  const motionConfig = createMissionsMotion(Boolean(useReducedMotion()));

  return <motion.div
    className="missions-notice"
    role="status"
    variants={motionConfig.notice}
    initial="hidden"
    animate="visible"
    exit="exit"
  >
    <BadgeCheck aria-hidden="true" />
    <span>{message}</span>
    <button type="button" onClick={onClose} aria-label="Dismiss message"><X /></button>
  </motion.div>;
};

const MissionHistoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const motionConfig = createMissionsMotion(Boolean(useReducedMotion()));

  return <motion.div
    className="missions-modal-backdrop"
    role="presentation"
    onMouseDown={onClose}
    variants={motionConfig.backdrop}
    initial="hidden"
    animate="visible"
    exit="exit"
  >
    <motion.section
      className="missions-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-history-title"
      onMouseDown={(event) => event.stopPropagation()}
      variants={motionConfig.modal}
    >
      <div>
        <h2 id="mission-history-title">Mission History</h2>
        <button type="button" onClick={onClose} aria-label="Close mission history"><X /></button>
      </div>
      <p>Mission history will be loaded from the mission service when its endpoint is available.</p>
      <ul>
        <li><CheckCircle2 /> Daily Login <span>Completed today</span></li>
        <li><CheckCircle2 /> Visit Marketplace <span>Completed today</span></li>
        <li><CheckCircle2 /> Weekly Explorer <span>Completed Jun 18</span></li>
      </ul>
    </motion.section>
  </motion.div>;
};

export const MissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionConfig = React.useMemo(
    () => createMissionsMotion(shouldReduceMotion),
    [shouldReduceMotion],
  );
  const [category, setCategory] = React.useState<MissionCategory>("daily");
  const [showAll, setShowAll] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const filteredMissions = React.useMemo(
    () => missionItems.filter((mission) => mission.category === category),
    [category],
  );
  const visibleMissions = showAll ? filteredMissions : filteredMissions.slice(0, 5);

  React.useEffect(() => {
    if (!historyOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHistoryOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [historyOpen]);

  const handleMissionAction = async (mission: MissionItem) => {
    if (mission.actionType === "navigate" && mission.actionTarget) {
      navigate(mission.actionTarget);
      return;
    }
    if (mission.actionType === "share") {
      try {
        if (navigator.share) {
          await navigator.share({ title: "AI Travel Marketplace", url: window.location.origin });
        } else {
          await navigator.clipboard.writeText(window.location.origin);
          setNotice("Marketplace link copied. Mission progress requires backend verification.");
        }
      } catch {
        // A cancelled native share sheet should leave mission state unchanged.
      }
      return;
    }
    setNotice("Claim preview only. The mission service must validate and issue this reward.");
  };

  const showDemoNotice = (label: string) =>
    setNotice(`${label} preview only. Production data will come from the mission service.`);

  return (
    <>
      <MissionsMobilePresentation
        category={category}
        missions={missionItems}
        onCategoryChange={(nextCategory) => {
          setCategory(nextCategory);
          setShowAll(false);
        }}
        onMissionAction={handleMissionAction}
        onHistory={() => setHistoryOpen(true)}
        onUpgrade={() => navigate("/membership")}
        reduceMotion={shouldReduceMotion}
      />

      <motion.main
        className="missions-page"
        variants={motionConfig.page}
        initial="hidden"
        animate="visible"
      >
        <div className="missions-page__container">
          <section className="missions-page__main">
            <MissionsHero onHistory={() => setHistoryOpen(true)} />
            <MissionsSummary />
            <SeasonProgress />

            <motion.section className="missions-card missions-board" variants={motionConfig.section}>
              <nav className="mission-tabs" aria-label="Mission categories">
                {categoryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={category === tab.id ? "page" : undefined}
                    className={category === tab.id ? "is-active" : ""}
                    onClick={() => {
                      setCategory(tab.id);
                      setShowAll(false);
                    }}
                  >
                    {category === tab.id && (
                      <motion.span
                        layoutId="mission-tab-active-desktop"
                        className="mission-tab-active"
                        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                      />
                    )}
                    <span className="mission-tab-label">
                      {tab.id === "events" && <Gift aria-hidden="true" />}
                      {tab.label}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="mission-list" aria-live="polite">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={`${category}-${showAll ? "all" : "compact"}`}
                    className="mission-list__results"
                    variants={motionConfig.list}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {visibleMissions.length ? (
                      visibleMissions.map((mission) => (
                        <MissionRow key={mission.id} mission={mission} onAction={handleMissionAction} />
                      ))
                    ) : (
                      <motion.div className="mission-list__empty" variants={motionConfig.row}>
                        <Star aria-hidden="true" />
                        <strong>No missions available</strong>
                        <p>New missions will appear here when the mission service publishes them.</p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {filteredMissions.length > 5 && (
                <motion.button
                  type="button"
                  className="mission-list__more"
                  onClick={() => setShowAll((value) => !value)}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  {showAll ? "Show Fewer Missions" : "Show More Missions"}
                  <ChevronDown className={showAll ? "is-open" : ""} aria-hidden="true" />
                </motion.button>
              )}
            </motion.section>

            <VipUpgradeBanner onUpgrade={() => navigate("/membership")} />
          </section>

          <motion.aside
            className="missions-page__sidebar"
            aria-label="Mission rewards and rankings"
            variants={motionConfig.list}
          >
            <DailyCheckInCard />
            <TodayRewardsCard onClaimAll={() => showDemoNotice("Claim All")} />
            <MissionsLeaderboardCard onViewAll={() => showDemoNotice("Leaderboard")} />
            <RecentAchievementCard onViewAll={() => showDemoNotice("Achievements")} />
          </motion.aside>
        </div>
      </motion.main>

      <AnimatePresence>
        {notice && <MissionsNotice message={notice} onClose={() => setNotice(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {historyOpen && <MissionHistoryModal onClose={() => setHistoryOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default MissionsPage;
