package com.travel.marketplace.modules.review.repository;

import com.travel.marketplace.modules.review.entity.ReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {
    List<ReviewImage> findByReviewIdOrderByDisplayOrderAsc(Long reviewId);
}
