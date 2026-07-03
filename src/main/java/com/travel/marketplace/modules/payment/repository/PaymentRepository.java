package com.travel.marketplace.modules.payment.repository;

import com.travel.marketplace.modules.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    Optional<Payment> findByOrderId(Long orderId);
    List<Payment> findAllByOrderUserIdOrderByCreatedAtDesc(Long userId);
}
