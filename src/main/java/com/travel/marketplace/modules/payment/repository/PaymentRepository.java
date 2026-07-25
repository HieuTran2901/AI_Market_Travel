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
}
