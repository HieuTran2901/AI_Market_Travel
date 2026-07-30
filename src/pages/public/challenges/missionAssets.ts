import goldCoin from "../../../assets/images/coin-gold.png";
import heroChest from "../../../assets/missions/hero/01-hero-treasure-chest-transparent.png";
import seasonPurpleChest from "../../../assets/missions/season/02-season-purple-chest-transparent.png";
import seasonSilverChest from "../../../assets/missions/season/03-season-silver-chest-transparent.png";
import seasonBlackChest from "../../../assets/missions/season/04-season-black-chest-transparent.png";
import seasonGoldChest from "../../../assets/missions/season/05-season-gold-chest-transparent.png";
import checkInDay7Chest from "../../../assets/missions/check-in/06-daily-checkin-chest-transparent.png";
import todayRewardsChest from "../../../assets/missions/summary/07-today-reward-chest-transparent.png";
import vipCard from "../../../assets/missions/vip/08-vip-card-transparent.png";
import dailyLogin from "../../../assets/missions/mission-actions/09-login-calendar-icon-transparent.png";
import miniGame from "../../../assets/missions/mission-actions/10-minigame-icon-transparent.png";
import completeMissions from "../../../assets/missions/mission-actions/11-task-list-icon-transparent.png";
import shareWebsite from "../../../assets/missions/mission-actions/12-share-icon-transparent.png";
import marketplace from "../../../assets/missions/mission-actions/13-marketplace-icon-transparent.png";
import seasonLevelBadge from "../../../assets/missions/season/14-season-level-badge-transparent.png";
import achievementBadge from "../../../assets/missions/achievements/15-achievement-crown-icon-transparent.png";
import rankGold from "../../../assets/missions/leaderboard/16-rank-gold-icon-transparent.png";
import rankSilver from "../../../assets/missions/leaderboard/17-rank-silver-icon-transparent.png";
import rankBronze from "../../../assets/missions/leaderboard/18-rank-bronze-icon-transparent.png";

export const missionAssets = {
  heroChest,
  goldCoin,
  seasonLevelBadge,
  seasonMilestones: {
    current: seasonPurpleChest,
    silver: seasonSilverChest,
    locked: seasonBlackChest,
    final: seasonGoldChest,
  },
  missionActions: {
    dailyLogin,
    miniGame,
    completeMissions,
    shareWebsite,
    marketplace,
  },
  checkInDay7Chest,
  todayRewardsChest,
  achievementBadge,
  vipCard,
  leaderboardRanks: {
    gold: rankGold,
    silver: rankSilver,
    bronze: rankBronze,
  },
} as const;

export type MissionAssets = typeof missionAssets;
