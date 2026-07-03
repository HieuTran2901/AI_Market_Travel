package com.travel.marketplace.modules.payment.repository;

import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);
    boolean existsByPaymentIdAndTransactionId(Long paymentId, String transactionId);
}
