package com.travel.marketplace.modules.review.repository;

import com.travel.marketplace.modules.review.entity.Review;
import com.travel.marketplace.modules.review.enums.ReviewStatus;
import com.travel.marketplace.modules.review.enums.TripType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("""
            SELECT r FROM Review r
            WHERE r.listing.id = :listingId
              AND r.status = :status
              AND (:rating IS NULL OR r.rating = :rating)
              AND (:tripType IS NULL OR r.tripType = :tripType)
            """)
    Page<Review> findListingReviews(
            @Param("listingId") Long listingId,
            @Param("status") ReviewStatus status,
            @Param("rating") Integer rating,
            @Param("tripType") TripType tripType,
            Pageable pageable
    );

    @Query("""
            SELECT r FROM Review r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:listingId IS NULL OR r.listing.id = :listingId)
            """)
    Page<Review> findForAdmin(
            @Param("status") ReviewStatus status,
            @Param("listingId") Long listingId,
            Pageable pageable
    );

    Optional<Review> findFirstByListingIdAndStatusOrderByCreatedAtDesc(Long listingId, ReviewStatus status);

    boolean existsByBookingIdAndDeletedAtIsNull(Long bookingId);

    @Query("""
            SELECT COUNT(r) FROM Review r
            WHERE r.listing.id = :listingId
              AND r.status = :status
            """)
    Long countPublishedByListingId(@Param("listingId") Long listingId, @Param("status") ReviewStatus status);

    @Query("""
            SELECT AVG(r.rating) FROM Review r
            WHERE r.listing.id = :listingId
              AND r.status = :status
            """)
    BigDecimal averageRatingByListingId(@Param("listingId") Long listingId, @Param("status") ReviewStatus status);

    @Query("""
            SELECT r.rating, COUNT(r) FROM Review r
            WHERE r.listing.id = :listingId
              AND r.status = :status
            GROUP BY r.rating
            """)
    List<Object[]> ratingDistribution(@Param("listingId") Long listingId, @Param("status") ReviewStatus status);
}
