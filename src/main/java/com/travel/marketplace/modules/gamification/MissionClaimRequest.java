package com.travel.marketplace.modules.gamification;

import lombok.Data;

@Data
public class MissionClaimRequest {
    private String missionId;
    private long rewardCoins;
    private long rewardExp;
}
