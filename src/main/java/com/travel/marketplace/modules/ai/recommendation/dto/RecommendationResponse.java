package com.travel.marketplace.modules.ai.recommendation.dto;

import com.travel.marketplace.modules.listing.dto.ListingResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    /** Ranked list of recommendations, best match first */
    private List<RankedRecommendation> recommendations;
    private String aiSummary;
    private String destination;
    private boolean mockedAi;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RankedRecommendation {
        private int rank;
        /** Score from 0–100 */
        private int score;
        /** AI-generated reasoning for this recommendation */
        private String reasoning;
        private ListingResponse listing;
    }
}
