package com.travel.marketplace.modules.payment.repository;

import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    
    @Query("SELECT p FROM Payment p WHERE p.order.id = :orderId")
    Optional<Payment> findByOrderId(@Param("orderId") Long orderId);

    Optional<Payment> findByPurposeAndReferenceId(PaymentPurpose purpose, Long referenceId);

    List<Payment> findByStatus(PaymentStatus status);
    
    List<Payment> findAllByOrderUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
            SELECT p FROM Payment p
            WHERE (p.order IS NOT NULL AND p.order.user.id = :userId)
               OR EXISTS (
                    SELECT purchase.id
                    FROM AiCoinPurchase purchase
                    WHERE purchase.id = p.referenceId
                      AND purchase.userId = :userId
                      AND (
                          p.purpose = :aiCoinPurpose
                          OR p.order IS NULL
                      )
               )
            ORDER BY p.createdAt DESC
            """)
    List<Payment> findAllVisibleToUserOrderByCreatedAtDesc(
            @Param("userId") Long userId,
            @Param("aiCoinPurpose") PaymentPurpose aiCoinPurpose
    );
}
