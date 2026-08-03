package com.travel.marketplace.modules.gamification;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/missions")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missionService;

    @PostMapping("/{missionId}/claim")
    public ApiResponse<MissionClaimResponse> claimMission(
            @PathVariable String missionId,
            @RequestBody MissionClaimRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // Enforce the path variable matches the request body for safety
        request.setMissionId(missionId);
        
        MissionClaimResponse response = missionService.claimMission(userPrincipal.getId(), request);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<java.util.List<MissionStatusResponse>> getUserMissions(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return ApiResponse.success(missionService.getUserMissions(userPrincipal.getId()));
    }

    @GetMapping("/summary")
    public ApiResponse<MissionDashboardSummaryResponse> getMissionDashboardSummary(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return ApiResponse.success(missionService.getMissionDashboardSummary(userPrincipal.getId()));
    }
}
