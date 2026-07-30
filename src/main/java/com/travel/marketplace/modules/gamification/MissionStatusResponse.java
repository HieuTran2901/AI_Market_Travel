package com.travel.marketplace.modules.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissionStatusResponse {
    private String missionId;
    private String status;
    private boolean claimed;
}
