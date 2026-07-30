import api from "./api";
import { ApiResponse } from "@/types";

export interface MissionClaimRequest {
  missionId: string;
  rewardCoins: number;
  rewardExp: number;
}

export interface MissionClaimResponse {
  missionId: string;
  latestAiCoinBalance: number;
  latestSeasonExp: number;
  status: string;
  claimed: boolean;
  message: string;
}

export interface MissionStatusResponse {
  missionId: string;
  status: string;
  claimed: boolean;
}

export const gamificationService = {
  claimMissionReward: async (missionId: string, rewardCoins: number, rewardExp: number): Promise<ApiResponse<MissionClaimResponse>> => {
    const response = await api.post<ApiResponse<MissionClaimResponse>>(
      `/missions/${missionId}/claim`,
      { rewardCoins, rewardExp }
    );
    return response.data;
  },

  getMissionStatus: async () => {
    const response = await api.get<{ data: MissionStatusResponse[] }>(`/missions`);
    return response.data.data;
  }
};
