export type MissionCategory =
  | "daily"
  | "weekly"
  | "monthly"
  | "special"
  | "events";

export type MissionStatus =
  | "in-progress"
  | "claimable"
  | "claimed"
  | "locked";

export type MissionActionType = "navigate" | "share" | "claim";

export type MissionIconName =
  | "calendar"
  | "game"
  | "tasks"
  | "share"
  | "marketplace"
  | "sparkles"
  | "plane"
  | "trophy";

export type MissionItem = {
  id: string;
  category: MissionCategory;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardCoins: number;
  status: MissionStatus;
  actionType?: MissionActionType;
  actionTarget?: string;
  icon: MissionIconName;
  tone: "violet" | "green" | "blue" | "amber" | "rose";
};

export type MissionSummary = {
  seasonLevel: number;
  seasonExp: number;
  seasonExpTarget: number;
  completedMissions: number;
  totalMissions: number;
  loginStreakDays: number;
  todayEarnedCoins: number;
};

export type SeasonMilestone = {
  level: number;
  rewardCoins: number;
  state: "completed" | "current" | "locked";
  final?: boolean;
};

export type DailyCheckInItem = {
  day: number;
  rewardCoins?: number;
  rewardLabel?: string;
  state: "claimed" | "current" | "upcoming";
};

export type MissionLeaderboardItem = {
  id: string;
  rank: number;
  name: string;
  score: number;
  currentUser?: boolean;
};

// TODO: Replace these isolated fixtures with mission, season, and leaderboard APIs.
export const demoMissionSummary: MissionSummary = {
  seasonLevel: 15,
  seasonExp: 2_450,
  seasonExpTarget: 5_000,
  completedMissions: 24,
  totalMissions: 68,
  loginStreakDays: 7,
  todayEarnedCoins: 320,
};

export const seasonMilestones: SeasonMilestone[] = [
  { level: 5, rewardCoins: 500, state: "completed" },
  { level: 10, rewardCoins: 1_000, state: "completed" },
  { level: 15, rewardCoins: 1_500, state: "current" },
  { level: 20, rewardCoins: 2_000, state: "locked" },
  { level: 30, rewardCoins: 3_000, state: "locked" },
  { level: 50, rewardCoins: 5_000, state: "locked", final: true },
];

export const missionItems: MissionItem[] = [
  {
    id: "daily-login",
    category: "daily",
    title: "Daily Login",
    description: "Sign in to your account",
    progress: 1,
    target: 1,
    rewardCoins: 50,
    status: "claimable",
    actionType: "claim",
    icon: "calendar",
    tone: "violet",
  },
  {
    id: "daily-mini-game",
    category: "daily",
    title: "Play Any Mini Game",
    description: "Complete one mini game",
    progress: 0,
    target: 1,
    rewardCoins: 80,
    status: "in-progress",
    actionType: "navigate",
    actionTarget: "/challenges/games",
    icon: "game",
    tone: "green",
  },
  {
    id: "daily-three-missions",
    category: "daily",
    title: "Complete Any 3 Missions",
    description: "Complete three missions today",
    progress: 1,
    target: 3,
    rewardCoins: 120,
    status: "in-progress",
    actionType: "navigate",
    actionTarget: "/challenges/missions",
    icon: "tasks",
    tone: "blue",
  },
  {
    id: "daily-share",
    category: "daily",
    title: "Share the Website",
    description: "Share AI Travel Marketplace with friends",
    progress: 0,
    target: 1,
    rewardCoins: 60,
    status: "in-progress",
    actionType: "share",
    icon: "share",
    tone: "amber",
  },
  {
    id: "daily-marketplace",
    category: "daily",
    title: "Visit Marketplace",
    description: "Open the Marketplace page",
    progress: 1,
    target: 1,
    rewardCoins: 40,
    status: "claimable",
    actionType: "claim",
    icon: "marketplace",
    tone: "rose",
  },
  {
    id: "daily-explore",
    category: "daily",
    title: "Explore a New Destination",
    description: "View a destination or travel experience",
    progress: 1,
    target: 2,
    rewardCoins: 70,
    status: "in-progress",
    actionType: "navigate",
    actionTarget: "/search",
    icon: "plane",
    tone: "blue",
  },
  {
    id: "weekly-planner",
    category: "weekly",
    title: "Plan a Complete Trip",
    description: "Create one itinerary with AI Planner",
    progress: 0,
    target: 1,
    rewardCoins: 350,
    status: "in-progress",
    actionType: "navigate",
    actionTarget: "/ai/planner",
    icon: "plane",
    tone: "violet",
  },
  {
    id: "monthly-explorer",
    category: "monthly",
    title: "Marketplace Explorer",
    description: "Visit 20 marketplace listings this month",
    progress: 12,
    target: 20,
    rewardCoins: 900,
    status: "in-progress",
    actionType: "navigate",
    actionTarget: "/search",
    icon: "marketplace",
    tone: "rose",
  },
  {
    id: "special-vip",
    category: "special",
    title: "VIP Season Challenge",
    description: "Unlock this mission with an active VIP membership",
    progress: 0,
    target: 1,
    rewardCoins: 1_500,
    status: "locked",
    icon: "sparkles",
    tone: "amber",
  },
  {
    id: "event-summer",
    category: "events",
    title: "Summer Travel Sprint",
    description: "Complete five event missions",
    progress: 2,
    target: 5,
    rewardCoins: 700,
    status: "in-progress",
    actionType: "navigate",
    actionTarget: "/challenges",
    icon: "trophy",
    tone: "violet",
  },
];

export const dailyCheckInItems: DailyCheckInItem[] = [
  { day: 1, rewardCoins: 30, state: "claimed" },
  { day: 2, rewardCoins: 50, state: "claimed" },
  { day: 3, rewardCoins: 100, state: "claimed" },
  { day: 4, rewardCoins: 100, state: "claimed" },
  { day: 5, rewardCoins: 150, state: "claimed" },
  { day: 6, rewardCoins: 150, state: "claimed" },
  { day: 7, rewardLabel: "Chest", state: "current" },
];

export const missionLeaderboard: MissionLeaderboardItem[] = [
  { id: "traveler-vip", rank: 1, name: "TravelerVIP", score: 24_680 },
  { id: "ocean-master", rank: 2, name: "OceanMaster", score: 19_450 },
  { id: "globe-trotter", rank: 3, name: "GlobeTrotter", score: 17_230 },
  { id: "current-user", rank: 28, name: "You", score: 2_450, currentUser: true },
];
