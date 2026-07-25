package com.travel.marketplace.modules.payment.repository;

import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);
    boolean existsByPaymentIdAndTransactionId(Long paymentId, String transactionId);
    Optional<PaymentTransaction> findByGatewayOrderId(String gatewayOrderId);
    Optional<PaymentTransaction> findByGatewayRequestId(String gatewayRequestId);
    Optional<PaymentTransaction> findFirstByPaymentIdAndGatewayOrderIdIsNotNullOrderByCreatedAtDesc(Long paymentId);
}
