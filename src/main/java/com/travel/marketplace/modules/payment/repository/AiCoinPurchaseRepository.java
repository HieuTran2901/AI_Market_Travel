package com.travel.marketplace.modules.payment.repository;

import com.travel.marketplace.modules.payment.entity.AiCoinPurchase;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AiCoinPurchaseRepository extends JpaRepository<AiCoinPurchase, Long> {
    
    Optional<AiCoinPurchase> findByIdempotencyKeyAndUserId(String idempotencyKey, Long userId);
    
    Optional<AiCoinPurchase> findByMerchantOrderId(String merchantOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM AiCoinPurchase p WHERE p.merchantOrderId = :merchantOrderId")
    Optional<AiCoinPurchase> findByMerchantOrderIdForUpdate(@Param("merchantOrderId") String merchantOrderId);
}
