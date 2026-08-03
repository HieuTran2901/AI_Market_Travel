package com.travel.marketplace.modules.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissionDashboardSummaryResponse {
    private Integer goldCoins;
    private Integer todayEarnedCoins;
    private Integer seasonExp;
    private Integer seasonExpTarget;
    private Integer seasonLevel;
    private Integer completedMissions;
    private Integer totalMissions;
    private Integer loginStreakDays;
    private Instant seasonEndDate;
}

