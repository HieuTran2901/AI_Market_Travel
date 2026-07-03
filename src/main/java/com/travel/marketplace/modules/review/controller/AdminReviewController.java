package com.travel.marketplace.modules.review.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.review.dto.ReviewResponse;
import com.travel.marketplace.modules.review.enums.ReviewStatus;
import com.travel.marketplace.modules.review.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final ReviewService reviewService;

    public AdminReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviewsForModeration(
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) Long listingId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<ReviewResponse> page = reviewService.getReviewsForAdmin(status, listingId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PatchMapping("/{reviewId}/hide")
    public ResponseEntity<ApiResponse<ReviewResponse>> hideReview(@PathVariable Long reviewId) {
        ReviewResponse response = reviewService.hideReview(reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review hidden successfully.", response));
    }

    @PatchMapping("/{reviewId}/publish")
    public ResponseEntity<ApiResponse<ReviewResponse>> publishReview(@PathVariable Long reviewId) {
        ReviewResponse response = reviewService.publishReview(reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review published successfully.", response));
    }
}
