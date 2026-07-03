package com.travel.marketplace.modules.ai.recommendation.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.ai.recommendation.dto.RecommendationRequest;
import com.travel.marketplace.modules.ai.recommendation.dto.RecommendationResponse;
import com.travel.marketplace.modules.ai.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * POST /api/v1/ai/recommendations
     * Returns AI-ranked travel recommendations based on preferences.
     * Public endpoint — no authentication required.
     */
    @PostMapping("/recommendations")
    public ApiResponse<RecommendationResponse> getRecommendations(
            @Valid @RequestBody RecommendationRequest request) {
        RecommendationResponse response = recommendationService.getRecommendations(request);
        return ApiResponse.success("Recommendations generated successfully", response);
    }
}
