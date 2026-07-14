package com.travel.marketplace.modules.review.dto;

import com.travel.marketplace.modules.review.enums.ReviewStatus;
import com.travel.marketplace.modules.review.enums.TripType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long listingId;
    private Long userId;
    private String userDisplayName;
    private String userAvatarUrl;
    private Long bookingId;
    private Integer rating;
    private String title;
    private String comment;
    private TripType tripType;
    private ReviewStatus status;
    private Integer helpfulCount;
    private Instant createdAt;
    private Instant updatedAt;
    private ReviewReplyResponse providerReply;
    private List<ReviewImageResponse> images;

    @Data
    @Builder
    public static class ReviewImageResponse {
        private Long id;
        private String imageUrl;
        private String altText;
        private Integer displayOrder;
    }
}
