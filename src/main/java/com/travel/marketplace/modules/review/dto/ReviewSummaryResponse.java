package com.travel.marketplace.modules.review.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ReviewSummaryResponse {
    private Long listingId;
    private BigDecimal averageRating;
    private Long reviewCount;
    private List<RatingDistributionResponse> ratingDistribution;
    private Map<String, BigDecimal> categoryScores;
    private ReviewResponse latestReviewPreview;
}
