import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { missionAssets } from "./missionAssets";
import { createMissionsMotion, missionsEase } from "./missionsMotion";
import type {
  MissionCategory,
  MissionIconName,
  MissionItem,
} from "./missionData";
import "./MissionsMobilePresentation.css";

const mobileCategoryTabs: Array<{
  id: Exclude<MissionCategory, "events">;
  label: string;
}> = [
  { id: "daily", label: "Daily Missions" },
  { id: "weekly", label: "Weekly Missions" },
  { id: "monthly", label: "Monthly Missions" },
  { id: "special", label: "Special Missions" },
];

const mobileCheckInRewards = [50, 50, 100, 100, 150, 150, 300] as const;

const missionActionAssets: Partial<Record<MissionIconName, string>> = {
  calendar: missionAssets.missionActions.dailyLogin,
  game: missionAssets.missionActions.miniGame,
  tasks: missionAssets.missionActions.completeMissions,
  share: missionAssets.missionActions.shareWebsite,
  marketplace: missionAssets.missionActions.marketplace,
};

const MobileProgressBar: React.FC<{ mission: MissionItem; reduceMotion: boolean }> = ({
  mission,
  reduceMotion,
}) => {
  const ratio = Math.min(mission.progress / Math.max(mission.target, 1), 1);

  return (
    <div className="missions-mobile-row__progress-line">
      <span
        className="missions-mobile-progress"
        role="progressbar"
        aria-label={`${mission.title} progress`}
        aria-valuemin={0}
        aria-valuemax={mission.target}
        aria-valuenow={mission.progress}
      >
        <motion.span
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: ratio }}
          style={{ transformOrigin: "left" }}
          transition={{ duration: reduceMotion ? 0 : 0.46, ease: missionsEase }}
        />
      </span>
      <small>
        {mission.progress} / {mission.target}
      </small>
    </div>
  );
};

const MobileMissionRow: React.FC<{
  mission: MissionItem;
  onAction: (mission: MissionItem) => void;
  reduceMotion: boolean;
}> = ({ mission, onAction, reduceMotion }) => {
  const motionConfig = createMissionsMotion(reduceMotion);
  const actionLabel =
    mission.status === "claimed"
      ? "Claimed"
      : mission.status === "locked"
        ? "Locked"
        : mission.actionType === "claim"
          ? "Claim"
          : mission.actionType === "share"
            ? "Share"
            : "Go Now";
  const disabled = mission.status === "claimed" || mission.status === "locked";
  const iconAsset = missionActionAssets[mission.icon];

  return (
    <motion.article
      className={`missions-mobile-row missions-mobile-row--${mission.tone}`}
      variants={motionConfig.row}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
    >
      <span className="missions-mobile-row__icon">
        {iconAsset ? (
          <img src={iconAsset} alt="" aria-hidden="true" loading="lazy" />
        ) : (
          <Sparkles aria-hidden="true" />
        )}
      </span>

      <div className="missions-mobile-row__body">
        <strong>{mission.title}</strong>
        <p>{mission.description}</p>
        <MobileProgressBar mission={mission} reduceMotion={reduceMotion} />
      </div>

      <div className="missions-mobile-row__trailing">
        <strong className="missions-mobile-row__reward">
          <img src={missionAssets.specialCoin} alt="Special Coin" />
          +{mission.rewardCoins}
        </strong>
        <motion.button
          type="button"
          disabled={disabled}
          className={mission.actionType === "claim" ? "is-claim" : ""}
          aria-label={`${actionLabel}: ${mission.title}`}
          onClick={() => onAction(mission)}
          whileTap={disabled || reduceMotion ? undefined : { scale: 0.975 }}
        >
          {mission.status === "claimed" && <CheckCircle2 aria-hidden="true" />}
          {mission.status === "locked" && <LockKeyhole aria-hidden="true" />}
          {actionLabel}
        </motion.button>
      </div>
    </motion.article>
  );
};

export const MissionsMobilePresentation: React.FC<{
  category: MissionCategory;
  missions: MissionItem[];
  onCategoryChange: (category: MissionCategory) => void;
  onMissionAction: (mission: MissionItem) => void;
  onHistory: () => void;
  onUpgrade: () => void;
  reduceMotion: boolean;
}> = ({
  category,
  missions,
  onCategoryChange,
  onMissionAction,
  onHistory,
  onUpgrade,
  reduceMotion,
}) => {
  const motionConfig = React.useMemo(
    () => createMissionsMotion(reduceMotion),
    [reduceMotion],
  );
  const activeMobileCategory = category === "events" ? "daily" : category;
  const visibleMissions = missions
    .filter((mission) => mission.category === activeMobileCategory)
    .slice(0, 5);

  return (
    <motion.main
      className="missions-mobile-presentation"
      variants={motionConfig.page}
      initial="hidden"
      animate="visible"
    >
      <div className="missions-mobile-presentation__inner">
        <motion.section
          className="missions-mobile-hero"
          aria-labelledby="missions-mobile-title"
          variants={motionConfig.section}
        >
          <motion.img
            src={missionAssets.heroChest}
            alt=""
            aria-hidden="true"
            className="missions-mobile-hero__art"
            variants={reduceMotion ? motionConfig.heroArt : motionConfig.section}
          />
          <motion.div className="missions-mobile-hero__copy" variants={motionConfig.section}>
            <h1 id="missions-mobile-title">
              <span>Complete Missions</span>
              Earn Special Coins!
            </h1>
            <p>More missions completed, more rewards unlocked.</p>
          </motion.div>
          <motion.button
            type="button"
            onClick={onHistory}
            variants={motionConfig.section}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <History aria-hidden="true" />
            Mission History
          </motion.button>
        </motion.section>

        <motion.section
          className="missions-mobile-checkin"
          aria-labelledby="mobile-checkin-title"
          variants={motionConfig.section}
        >
          <header>
            <div>
              <h2 id="mobile-checkin-title">DAILY CHECK-IN</h2>
              <p>Check in for 7 consecutive days to earn bigger rewards!</p>
            </div>
            <strong>Checked in: <span>1/7</span></strong>
          </header>
          <motion.div className="missions-mobile-checkin__rail" variants={motionConfig.checkInList}>
            {mobileCheckInRewards.map((reward, index) => {
              const day = index + 1;
              return (
                <motion.div
                  key={day}
                  className={`missions-mobile-checkin__day ${day === 1 ? "is-current is-complete" : ""}`}
                  variants={motionConfig.checkInItem}
                >
                  <span className="missions-mobile-checkin__reward-icon">
                    {day === 1 ? (
                      <motion.span
                        className="missions-mobile-checkin__check"
                        initial={reduceMotion ? false : { scale: 0.75 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      >
                        <Check aria-hidden="true" />
                      </motion.span>
                    ) : day === 7 ? (
                      <img
                        src={missionAssets.checkInDay7Chest}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                      />
                    ) : (
                      <img src={missionAssets.specialCoin} alt="" aria-hidden="true" />
                    )}
                  </span>
                  <strong>+{reward}</strong>
                  <small>Day {day}</small>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        <nav className="missions-mobile-tabs" aria-label="Mission categories">
          {mobileCategoryTabs.map((tab) => {
            const hasClaimable = missions.some(
              (mission) => mission.category === tab.id && mission.status === "claimable",
            );
            return (
              <button
                key={tab.id}
                type="button"
                className={activeMobileCategory === tab.id ? "is-active" : ""}
                aria-current={activeMobileCategory === tab.id ? "page" : undefined}
                onClick={() => onCategoryChange(tab.id)}
              >
                {activeMobileCategory === tab.id && (
                  <motion.span
                    layoutId="mission-tab-active-mobile"
                    className="mission-tab-active"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <span className="mission-tab-label">{tab.label}</span>
                {hasClaimable && (
                  <motion.span
                    className="mission-tab-notification"
                    aria-label="Reward ready to claim"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <section className="missions-mobile-board" aria-labelledby="missions-mobile-list-title">
          <header>
            <h2 id="missions-mobile-list-title">
              <Clock3 aria-hidden="true" />
              {mobileCategoryTabs.find((tab) => tab.id === activeMobileCategory)?.label.toUpperCase()}
            </h2>
            <span>Resets in: <strong>14:18:32</strong></span>
          </header>

          <div className="missions-mobile-list" aria-live="polite">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={activeMobileCategory}
                className="missions-mobile-list__results"
                variants={motionConfig.list}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {visibleMissions.length ? (
                  visibleMissions.map((mission) => (
                    <MobileMissionRow
                      key={mission.id}
                      mission={mission}
                      onAction={onMissionAction}
                      reduceMotion={reduceMotion}
                    />
                  ))
                ) : (
                  <motion.div className="missions-mobile-empty" variants={motionConfig.row}>
                    <Sparkles aria-hidden="true" />
                    <strong>No missions available</strong>
                    <p>New missions will appear here when they become available.</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <motion.section
          className="missions-mobile-vip"
          variants={motionConfig.vip}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <motion.img
            src={missionAssets.vipCard}
            alt="VIP membership card"
            loading="lazy"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
          />
          <div>
            <strong>UPGRADE TO VIP</strong>
            <p>Earn more Special Coins and unlock exclusive rewards.</p>
          </div>
          <motion.button
            type="button"
            onClick={onUpgrade}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            Upgrade Now
            <ChevronRight aria-hidden="true" />
          </motion.button>
        </motion.section>
      </div>
    </motion.main>
  );
};
