package com.travel.marketplace.modules.payment.repository;

import com.travel.marketplace.modules.payment.entity.AiCoinTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiCoinTransactionRepository extends JpaRepository<AiCoinTransaction, Long> {

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<AiCoinTransaction> findByIdempotencyKey(String idempotencyKey);

    Page<AiCoinTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
