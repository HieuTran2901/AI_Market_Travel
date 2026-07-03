package com.travel.marketplace.modules.review.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RatingDistributionResponse {
    private Integer rating;
    private Long count;
}
