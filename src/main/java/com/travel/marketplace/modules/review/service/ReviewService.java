package com.travel.marketplace.modules.review.service;

import com.travel.marketplace.modules.review.dto.ReviewCreateRequest;
import com.travel.marketplace.modules.review.dto.ReviewResponse;
import com.travel.marketplace.modules.review.dto.ReviewSummaryResponse;
import com.travel.marketplace.modules.review.dto.ReviewUpdateRequest;
import com.travel.marketplace.modules.review.enums.ReviewStatus;
import com.travel.marketplace.modules.review.enums.TripType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    Page<ReviewResponse> getListingReviews(Long listingId, Integer rating, TripType tripType, Pageable pageable);
    ReviewSummaryResponse getListingReviewSummary(Long listingId);
    ReviewResponse createReview(Long listingId, Long userId, ReviewCreateRequest request);
    ReviewResponse updateReview(Long reviewId, Long userId, ReviewUpdateRequest request);
    void deleteReview(Long reviewId, Long userId);
    Page<ReviewResponse> getReviewsForAdmin(ReviewStatus status, Long listingId, Pageable pageable);
    ReviewResponse hideReview(Long reviewId);
    ReviewResponse publishReview(Long reviewId);
}
