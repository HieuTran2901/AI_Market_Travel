import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  X,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Calendar,
  Store,
  Plane,
  MessageSquare,
  Star,
  Sparkles,
  Zap,
  Gift,
  Award,
  Shield,
  Clock,
  Crown,
  Key,
} from "lucide-react";

// Assets
import aiCoinImg from "@/assets/images/coin-gold.png";
import specialCoinImg from "@/assets/images/coin-silver.png";

// Chest Assets
import chestCommon from "@/assets/images/lucky-wheel/chests/chest-common.png";
import chestPremium from "@/assets/images/lucky-wheel/chests/chest-silver.png";
import chestEpic from "@/assets/images/lucky-wheel/chests/chest-gold.png";
import chestLegendary from "@/assets/images/lucky-wheel/chests/chest-jackpot.png";

const MOCK_HISTORY = [
  {
    id: 1,
    title: "Daily Login",
    desc: "Log in to the platform",
    date: "Today, 09:15 AM",
    reward: 30,
    status: "completed",
    icon: Calendar,
    color: "#10b981",
  },
  {
    id: 2,
    title: "Visit Marketplace",
    desc: "Browse travel deals",
    date: "Today, 09:16 AM",
    reward: 50,
    status: "completed",
    icon: Store,
    color: "#10b981",
  },
  {
    id: 3,
    title: "Weekly Explorer",
    desc: "Complete 3 trips",
    date: "Jun 18, 2025",
    reward: 200,
    status: "completed",
    icon: Sparkles,
    color: "#3b82f6",
  },
  {
    id: 4,
    title: "Book a Trip",
    desc: "Book any trip from marketplace",
    date: "Jun 18, 2025",
    reward: 150,
    status: "completed",
    icon: Plane,
    color: "#8b5cf6",
  },
  {
    id: 5,
    title: "Leave a Review",
    desc: "Leave a review for any trip",
    date: "Jun 18, 2025",
    reward: 100,
    status: "completed",
    icon: MessageSquare,
    color: "#3b82f6",
  },
  {
    id: 6,
    title: "Event Mission 1",
    desc: "Complete event mission 1",
    date: "Jun 17, 2025",
    reward: 100,
    status: "completed",
    icon: Star,
    color: "#d946ef",
  },
  {
    id: 7,
    title: "Event Mission 2",
    desc: "Complete event mission 2",
    date: "Jun 17, 2025",
    reward: 150,
    status: "completed",
    icon: Star,
    color: "#d946ef",
  },
  {
    id: 8,
    title: "Flight Search",
    desc: "Search for flights",
    date: "Jun 17, 2025",
    reward: 0,
    status: "missed",
    icon: Plane,
    color: "#ef4444",
  },
];

const INFO_BANNER = [
  {
    icon: Gift,
    title: "Amazing Rewards",
    desc: "Win coins, boosters, items and more!",
  },
  {
    icon: Shield,
    title: "Different Rarities",
    desc: "From Common to Legendary chests",
  },
  { icon: Clock, title: "New Chests", desc: "New chests available regularly!" },
  {
    icon: Crown,
    title: "Better Chances",
    desc: "Higher rarity chests, better rewards!",
  },
];

const MOCK_COUNTS: Record<string, number> = {
  common: 3,
  premium: 1,
  epic: 0,
  legendary: 0,
};

const CHESTS = [
  {
    id: "common",
    name: "Random Chest",
    rarity: "Common",
    rarityClass: "common",
    image: chestCommon,
    rewards: [
      { name: "AI Coins", value: "50–150", icon: aiCoinImg, isImg: true },
      { name: "Small XP Boost", value: "", icon: Zap, iconColor: "#f59e0b" },
      { name: "Common Item", value: "", icon: Gift, iconColor: "#94a3b8" },
      { name: "Travel Coupon", value: "", icon: Gift, iconColor: "#3b82f6" },
    ],
    dropChance: "★★★★★ Common",
  },
  {
    id: "premium",
    name: "Premium Chest",
    rarity: "Rare",
    rarityClass: "rare",
    image: chestPremium,
    rewards: [
      { name: "AI Coins", value: "150–500", icon: aiCoinImg, isImg: true },
      {
        name: "Special Coins",
        value: "20–80",
        icon: specialCoinImg,
        isImg: true,
      },
      { name: "Rare Item", value: "", icon: Gift, iconColor: "#3b82f6" },
      { name: "Premium Voucher", value: "", icon: Gift, iconColor: "#a855f7" },
    ],
    dropChance: "★★★★ Rare",
  },
  {
    id: "epic",
    name: "Epic Chest",
    rarity: "Epic",
    rarityClass: "epic",
    image: chestEpic,
    rewards: [
      { name: "AI Coins", value: "500–1500", icon: aiCoinImg, isImg: true },
      {
        name: "Special Coins",
        value: "100–300",
        icon: specialCoinImg,
        isImg: true,
      },
      {
        name: "Epic Equipment",
        value: "",
        icon: Sparkles,
        iconColor: "#d946ef",
      },
      { name: "Event Ticket", value: "", icon: Gift, iconColor: "#ec4899" },
    ],
    dropChance: "★★★ Epic",
  },
  {
    id: "legendary",
    name: "VIP Chest",
    rarity: "Legendary",
    rarityClass: "legendary",
    image: chestLegendary,
    rewards: [
      { name: "AI Coins", value: "1500–5000", icon: aiCoinImg, isImg: true },
      {
        name: "Special Coins",
        value: "500–1000",
        icon: specialCoinImg,
        isImg: true,
      },
      {
        name: "Legendary Item",
        value: "",
        icon: Sparkles,
        iconColor: "#f59e0b",
      },
      {
        name: "Exclusive Avatar",
        value: "",
        icon: Award,
        iconColor: "#fbbf24",
      },
      { name: "Exclusive Badge", value: "", icon: Award, iconColor: "#f59e0b" },
    ],
    dropChance: "★ Legendary",
  },
];

export const MissionHistoryModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<"history" | "chests">(
    "history",
  );
  const [activeHistoryTab, setActiveHistoryTab] = useState("All");
  const [activeChest, setActiveChest] = useState("common");

  const renderIcon = (Icon: any, color: string) => {
    return <Icon size={24} color={color} />;
  };

  const variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  };

  return (
    <motion.div
      className="missions-history-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="missions-history-modal"
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="missions-history-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Secondary Navigation */}
        <div className="modal-subtabs">
          <button
            className={`modal-subtab-btn ${activeMainTab === "history" ? "active" : ""}`}
            onClick={() => setActiveMainTab("history")}
          >
            <History size={18} />
            Mission History
          </button>
          <button
            className={`modal-subtab-btn ${activeMainTab === "chests" ? "active" : ""}`}
            onClick={() => setActiveMainTab("chests")}
          >
            <img
              src={chestEpic}
              alt="Chests"
              style={{ width: 20, height: 20, objectFit: "contain" }}
            />
            Treasure Chests
          </button>
        </div>

        <div className="modal-content-area">
          <AnimatePresence mode="wait">
            {activeMainTab === "history" ? (
              <motion.div
                key="history-tab"
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mission-history-full"
              >
                <div className="mission-history-header">
                  <div className="mission-history-header__icon">
                    <History size={28} />
                  </div>
                  <div>
                    <h2>Mission History</h2>
                    <p>Track your mission progress and rewards</p>
                  </div>
                </div>

                <div className="mission-history-filters">
                  <div className="filter-tabs">
                    {["All", "Completed", "In Progress", "Missed"].map(
                      (tab) => (
                        <button
                          key={tab}
                          className={`filter-tab ${activeHistoryTab === tab ? "active" : ""}`}
                          onClick={() => setActiveHistoryTab(tab)}
                        >
                          {tab}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="filter-dropdown">
                    All Types <ChevronDown size={18} />
                  </div>
                </div>

                <div className="mission-history-list">
                  {MOCK_HISTORY.map((item) => (
                    <div key={item.id} className="mission-history-row">
                      <div
                        className={`mission-history-row__status ${item.status}`}
                      >
                        {item.status === "completed" ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <XCircle size={18} />
                        )}
                      </div>
                      <div className="mission-history-row__icon">
                        {renderIcon(item.icon, item.color)}
                      </div>
                      <div className="mission-history-row__info">
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                      </div>
                      <div className="mission-history-row__date">
                        {item.date}
                      </div>
                      <div
                        className={`mission-history-row__reward ${item.status}`}
                      >
                        {item.status === "completed" ? (
                          <>
                            +{item.reward}
                            <img src={aiCoinImg} alt="AI Coin" />
                          </>
                        ) : (
                          <>
                            Missed
                            <span
                              style={{ fontSize: "13px", color: "#64748b" }}
                            >
                              Expired
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mission-history-pagination">
                  <span className="pagination-text">
                    Showing 1-8 of 38 missions
                  </span>
                  <div className="pagination-controls">
                    <button className="page-btn">{"<"}</button>
                    <button className="page-btn active">1</button>
                    <button className="page-btn">2</button>
                    <button className="page-btn">3</button>
                    <button className="page-btn">...</button>
                    <button className="page-btn">{">"}</button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chests-tab"
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="treasure-chests-full"
              >
                <motion.div
                  className="treasure-chests-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, staggerChildren: 0.1 }}
                >
                  <div className="tc-header-section">
                    <div className="tc-header-title">
                      <h2>TREASURE CHESTS</h2>
                      <p>Open chests and get amazing rewards</p>
                    </div>
                  </div>

                  <div className="tc-info-banner">
                    {INFO_BANNER.map((item, idx) => (
                      <div key={idx} className="tc-info-item">
                        <div className="tc-info-icon">
                          <item.icon size={24} color="#a78bfa" />
                        </div>
                        <div className="tc-info-text">
                          <h4>{item.title}</h4>
                          <p>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="chests-grid">
                    {CHESTS.map((chest, index) => (
                      <motion.div
                        key={chest.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`chest-card ${chest.rarityClass} ${activeChest === chest.id ? "active" : ""}`}
                        onClick={() => setActiveChest(chest.id)}
                      >
                        <h3 className="chest-title">{chest.name}</h3>
                        <span className={`chest-rarity ${chest.rarityClass}`}>
                          {chest.rarity}
                        </span>

                        <div
                          className={`chest-image-wrapper glow-${chest.rarityClass}`}
                        >
                          <img
                            src={chest.image}
                            alt={chest.name}
                            className="chest-image"
                          />
                          <div className="chest-particles"></div>
                        </div>

                        <div className="chest-inline-rewards">
                          <div className="chest-inline-rewards-title">
                            Possible Rewards
                          </div>
                          <div className="chest-inline-rewards-list">
                            {chest.rewards.map((reward, i) => (
                              <div key={i} className="inline-reward-item">
                                <div className="inline-reward-icon-box">
                                  {reward.isImg ? (
                                    <img
                                      src={reward.icon as string}
                                      alt={reward.name}
                                    />
                                  ) : (
                                    <reward.icon
                                      size={18}
                                      color={reward.iconColor}
                                    />
                                  )}
                                </div>
                                <div className="inline-reward-texts">
                                  {reward.value && (
                                    <span className="inline-reward-val">
                                      {reward.value}
                                    </span>
                                  )}
                                  <span className="inline-reward-name">
                                    {reward.name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button className="chest-btn">Open</button>
                        <div className="chest-inventory-count">
                          <Key
                            size={14}
                            className={
                              MOCK_COUNTS[chest.id] > 0 ? "has-key" : "no-key"
                            }
                          />
                          You have:{" "}
                          <span
                            className={
                              MOCK_COUNTS[chest.id] > 0 ? "has-key" : "no-key"
                            }
                          >
                            {MOCK_COUNTS[chest.id]}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="tc-summary-footer">
                    <div className="tc-summary-text">
                      <Sparkles size={16} color="#a78bfa" />
                      Rewards are random. The higher the rarity, the better the
                      rewards!
                    </div>
                    <button className="tc-reward-rates-btn">
                      Reward Rates {">"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
