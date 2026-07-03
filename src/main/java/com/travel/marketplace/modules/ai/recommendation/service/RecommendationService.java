package com.travel.marketplace.modules.ai.recommendation.service;

import com.travel.marketplace.modules.ai.recommendation.dto.RecommendationRequest;
import com.travel.marketplace.modules.ai.recommendation.dto.RecommendationResponse;

public interface RecommendationService {
    RecommendationResponse getRecommendations(RecommendationRequest request);
}
