package com.travel.marketplace.modules.review.repository;

import com.travel.marketplace.modules.review.entity.ReviewReply;
import com.travel.marketplace.modules.review.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {
    Optional<ReviewReply> findFirstByReviewIdAndStatusOrderByCreatedAtDesc(Long reviewId, ReviewStatus status);
}
