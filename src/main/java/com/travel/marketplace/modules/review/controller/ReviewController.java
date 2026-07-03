package com.travel.marketplace.modules.review.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.review.dto.ReviewCreateRequest;
import com.travel.marketplace.modules.review.dto.ReviewResponse;
import com.travel.marketplace.modules.review.dto.ReviewSummaryResponse;
import com.travel.marketplace.modules.review.dto.ReviewUpdateRequest;
import com.travel.marketplace.modules.review.enums.TripType;
import com.travel.marketplace.modules.review.service.ReviewService;
import com.travel.marketplace.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/listings/{listingId}/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getListingReviews(
            @PathVariable Long listingId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) TripType tripType,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        Page<ReviewResponse> page = reviewService.getListingReviews(listingId, rating, tripType, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/listings/{listingId}/reviews/summary")
    public ResponseEntity<ApiResponse<ReviewSummaryResponse>> getListingReviewSummary(@PathVariable Long listingId) {
        ReviewSummaryResponse response = reviewService.getListingReviewSummary(listingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/listings/{listingId}/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Long listingId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ReviewCreateRequest request) {
        ReviewResponse response = reviewService.createReview(listingId, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Review submitted successfully.", response));
    }

    @PutMapping("/reviews/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ReviewUpdateRequest request) {
        ReviewResponse response = reviewService.updateReview(reviewId, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Review updated successfully.", response));
    }

    @DeleteMapping("/reviews/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        reviewService.deleteReview(reviewId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully.", null));
    }
}
