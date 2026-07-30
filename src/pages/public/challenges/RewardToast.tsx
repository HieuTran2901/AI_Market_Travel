import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Star, Gift, Zap } from "lucide-react";
import { missionAssets } from "./missionAssets";
import "./RewardToast.css";

export interface RewardData {
  aiCoins?: number;
  exp?: number;
  specialCoins?: number;
  voucher?: string;
}

interface RewardToastProps {
  rewards: RewardData;
  onClose: () => void;
}

export const RewardToast: React.FC<RewardToastProps> = ({ rewards, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const hasRewards =
    (rewards.aiCoins && rewards.aiCoins > 0) ||
    (rewards.exp && rewards.exp > 0) ||
    (rewards.specialCoins && rewards.specialCoins > 0) ||
    rewards.voucher;

  if (!hasRewards) return null;

  return (
    <motion.div
      className="reward-toast"
      initial={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
      animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
      exit={{ opacity: 0, y: -10, x: "-50%", scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      role="alert"
    >
      <div className="reward-toast__header">
        <span className="reward-toast__check">
          <Check size={16} strokeWidth={3} />
        </span>
        <strong>Mission Claimed</strong>
      </div>
      
      <div className="reward-toast__content">
        {rewards.aiCoins ? (
          <div className="reward-toast__item">
            <img src={missionAssets.goldCoin} alt="AI Coin" />
            <span>+{rewards.aiCoins} AI Coins</span>
          </div>
        ) : null}
        
        {rewards.exp ? (
          <div className="reward-toast__item reward-toast__item--exp">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span>+{rewards.exp} EXP</span>
          </div>
        ) : null}
        
        {rewards.specialCoins ? (
          <div className="reward-toast__item reward-toast__item--special">
            <Zap size={16} className="fill-blue-400 text-blue-400" />
            <span>+{rewards.specialCoins} Special Coins</span>
          </div>
        ) : null}

        {rewards.voucher ? (
          <div className="reward-toast__item reward-toast__item--voucher">
            <Gift size={16} className="text-purple-400" />
            <span>{rewards.voucher}</span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};
