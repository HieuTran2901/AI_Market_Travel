package com.travel.marketplace.modules.review.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.booking.entity.Booking;
import com.travel.marketplace.modules.booking.enums.BookingStatus;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.review.dto.RatingDistributionResponse;
import com.travel.marketplace.modules.review.dto.ReviewCreateRequest;
import com.travel.marketplace.modules.review.dto.ReviewResponse;
import com.travel.marketplace.modules.review.dto.ReviewSummaryResponse;
import com.travel.marketplace.modules.review.dto.ReviewUpdateRequest;
import com.travel.marketplace.modules.review.entity.Review;
import com.travel.marketplace.modules.review.entity.ReviewReply;
import com.travel.marketplace.modules.review.enums.ReviewStatus;
import com.travel.marketplace.modules.review.enums.TripType;
import com.travel.marketplace.modules.review.mapper.ReviewMapper;
import com.travel.marketplace.modules.review.repository.ReviewReplyRepository;
import com.travel.marketplace.modules.review.repository.ReviewRepository;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewReplyRepository reviewReplyRepository;
    private final ListingRepository listingRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            ReviewReplyRepository reviewReplyRepository,
            ListingRepository listingRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            ReviewMapper reviewMapper
    ) {
        this.reviewRepository = reviewRepository;
        this.reviewReplyRepository = reviewReplyRepository;
        this.listingRepository = listingRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.reviewMapper = reviewMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getListingReviews(Long listingId, Integer rating, TripType tripType, Pageable pageable) {
        ensureListingExists(listingId);
        validateRatingFilter(rating);

        return reviewRepository.findListingReviews(listingId, ReviewStatus.PUBLISHED, rating, tripType, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryResponse getListingReviewSummary(Long listingId) {
        ensureListingExists(listingId);
        Long reviewCount = reviewRepository.countPublishedByListingId(listingId, ReviewStatus.PUBLISHED);
        BigDecimal averageRating = reviewRepository.averageRatingByListingId(listingId, ReviewStatus.PUBLISHED);
        List<RatingDistributionResponse> distribution = buildDistribution(listingId);
        ReviewResponse latest = reviewRepository.findFirstByListingIdAndStatusOrderByCreatedAtDesc(listingId, ReviewStatus.PUBLISHED)
                .map(this::toResponse)
                .orElse(null);

        return ReviewSummaryResponse.builder()
                .listingId(listingId)
                .averageRating(averageRating != null ? averageRating.setScale(2, RoundingMode.HALF_UP) : null)
                .reviewCount(reviewCount)
                .ratingDistribution(distribution)
                .categoryScores(Map.of())
                .latestReviewPreview(latest)
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse createReview(Long listingId, Long userId, ReviewCreateRequest request) {
        Listing listing = ensureListingExists(listingId);
        User user = getUser(userId);
        validateRating(request.getRating());
        validateReviewText(request);

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_ALLOWED, "You cannot review an inactive listing.");
        }

        Booking booking = bookingRepository.findByIdAndOrderUserIdAndListingId(request.getBookingId(), userId, listingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_BOOKING_REQUIRED, "You can review this listing after completing a booking."));

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.REVIEW_BOOKING_REQUIRED, "Only confirmed or completed bookings can be reviewed.");
        }

        if (reviewRepository.existsByBookingIdAndDeletedAtIsNull(booking.getId())) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS, "A review already exists for this booking.");
        }

        Review review = Review.builder()
                .listing(listing)
                .user(user)
                .booking(booking)
                .rating(request.getRating())
                .title(trimToNull(request.getTitle()))
                .comment(request.getComment().trim())
                .tripType(request.getTripType() != null ? request.getTripType() : TripType.OTHER)
                .status(ReviewStatus.PUBLISHED)
                .helpfulCount(0)
                .build();

        Review saved = reviewRepository.save(review);
        recalculateListingRating(listingId);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long reviewId, Long userId, ReviewUpdateRequest request) {
        Review review = getReview(reviewId);
        ensureOwner(review, userId);

        if (request.getRating() != null) {
            validateRating(request.getRating());
            review.setRating(request.getRating());
        }
        if (request.getTitle() != null) {
            review.setTitle(trimToNull(request.getTitle()));
        }
        if (request.getComment() != null) {
            validateComment(request.getComment());
            review.setComment(request.getComment().trim());
        }
        if (request.getTripType() != null) {
            review.setTripType(request.getTripType());
        }

        Review saved = reviewRepository.save(review);
        recalculateListingRating(saved.getListing().getId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = getReview(reviewId);
        ensureOwner(review, userId);
        Long listingId = review.getListing().getId();
        review.softDelete();
        reviewRepository.save(review);
        recalculateListingRating(listingId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForAdmin(ReviewStatus status, Long listingId, Pageable pageable) {
        return reviewRepository.findForAdmin(status, listingId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public ReviewResponse hideReview(Long reviewId) {
        Review review = getReview(reviewId);
        review.setStatus(ReviewStatus.HIDDEN);
        Review saved = reviewRepository.save(review);
        recalculateListingRating(saved.getListing().getId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ReviewResponse publishReview(Long reviewId) {
        Review review = getReview(reviewId);
        review.setStatus(ReviewStatus.PUBLISHED);
        Review saved = reviewRepository.save(review);
        recalculateListingRating(saved.getListing().getId());
        return toResponse(saved);
    }

    private ReviewResponse toResponse(Review review) {
        ReviewReply reply = reviewReplyRepository.findFirstByReviewIdAndStatusOrderByCreatedAtDesc(review.getId(), ReviewStatus.PUBLISHED)
                .orElse(null);
        return reviewMapper.toResponse(review, reply);
    }

    private List<RatingDistributionResponse> buildDistribution(Long listingId) {
        Map<Integer, Long> counts = reviewRepository.ratingDistribution(listingId, ReviewStatus.PUBLISHED).stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]
                ));

        List<RatingDistributionResponse> distribution = new ArrayList<>();
        for (int rating = 5; rating >= 1; rating--) {
            distribution.add(RatingDistributionResponse.builder()
                    .rating(rating)
                    .count(counts.getOrDefault(rating, 0L))
                    .build());
        }
        return distribution;
    }

    private void recalculateListingRating(Long listingId) {
        Listing listing = ensureListingExists(listingId);
        Long reviewCount = reviewRepository.countPublishedByListingId(listingId, ReviewStatus.PUBLISHED);
        BigDecimal averageRating = reviewRepository.averageRatingByListingId(listingId, ReviewStatus.PUBLISHED);

        listing.setReviewCount(reviewCount.intValue());
        listing.setAverageRating(averageRating != null ? averageRating.setScale(2, RoundingMode.HALF_UP) : null);
        listingRepository.save(listing);
    }

    private Listing ensureListingExists(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private Review getReview(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));
    }

    private void ensureOwner(Review review, Long userId) {
        if (!review.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.REVIEW_ACCESS_DENIED, "You can only manage your own reviews.");
        }
    }

    private void validateRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new BadRequestException("Rating must be between 1 and 5.", ErrorCode.REVIEW_INVALID_RATING);
        }
    }

    private void validateRatingFilter(Integer rating) {
        if (rating != null) {
            validateRating(rating);
        }
    }

    private void validateReviewText(ReviewCreateRequest request) {
        if (request.getTitle() != null && request.getTitle().trim().length() > 150) {
            throw new BadRequestException("Title must be 150 characters or less.", ErrorCode.VALIDATION_FAILED);
        }
        validateComment(request.getComment());
    }

    private void validateComment(String comment) {
        if (comment == null || comment.trim().length() < 10 || comment.trim().length() > 2000) {
            throw new BadRequestException("Comment must be between 10 and 2000 characters.", ErrorCode.VALIDATION_FAILED);
        }
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
