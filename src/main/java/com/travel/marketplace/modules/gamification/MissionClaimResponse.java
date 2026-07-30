package com.travel.marketplace.modules.gamification;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MissionClaimResponse {
    private String missionId;
    private long latestAiCoinBalance;
    private long latestSeasonExp;
    private String status;
    private boolean claimed;
    private String message;
}
