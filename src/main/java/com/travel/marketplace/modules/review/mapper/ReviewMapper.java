package com.travel.marketplace.modules.review.mapper;

import com.travel.marketplace.modules.review.dto.ReviewReplyResponse;
import com.travel.marketplace.modules.review.dto.ReviewResponse;
import com.travel.marketplace.modules.review.entity.Review;
import com.travel.marketplace.modules.review.entity.ReviewImage;
import com.travel.marketplace.modules.review.entity.ReviewReply;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class ReviewMapper {

    public ReviewResponse toResponse(Review review, ReviewReply reply, List<ReviewImage> images) {
        return ReviewResponse.builder()
                .id(review.getId())
                .listingId(review.getListing().getId())
                .userId(review.getUser().getId())
                .userDisplayName(review.getUser().getFullName())
                .userAvatarUrl(review.getUser().getAvatarUrl())
                .bookingId(review.getBooking() != null ? review.getBooking().getId() : null)
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .tripType(review.getTripType())
                .status(review.getStatus())
                .helpfulCount(review.getHelpfulCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .providerReply(reply != null ? toReplyResponse(reply) : null)
                .images(toImageResponses(images))
                .build();
    }

    public ReviewReplyResponse toReplyResponse(ReviewReply reply) {
        return ReviewReplyResponse.builder()
                .id(reply.getId())
                .reviewId(reply.getReview().getId())
                .userId(reply.getUser().getId())
                .userDisplayName(reply.getUser().getFullName())
                .replyText(reply.getReplyText())
                .status(reply.getStatus())
                .createdAt(reply.getCreatedAt())
                .updatedAt(reply.getUpdatedAt())
                .build();
    }

    private List<ReviewResponse.ReviewImageResponse> toImageResponses(List<ReviewImage> images) {
        if (images == null || images.isEmpty()) {
            return Collections.emptyList();
        }

        return images.stream()
                .map(image -> ReviewResponse.ReviewImageResponse.builder()
                        .id(image.getId())
                        .imageUrl(image.getImageUrl())
                        .altText(image.getAltText())
                        .displayOrder(image.getDisplayOrder())
                        .build())
                .toList();
    }
}
