package com.travel.marketplace.modules.review.dto;

import com.travel.marketplace.modules.review.enums.ReviewStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ReviewReplyResponse {
    private Long id;
    private Long reviewId;
    private Long userId;
    private String userDisplayName;
    private String replyText;
    private ReviewStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
