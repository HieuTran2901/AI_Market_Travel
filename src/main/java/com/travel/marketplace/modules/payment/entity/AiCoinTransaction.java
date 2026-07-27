package com.travel.marketplace.modules.payment.entity;

import com.travel.marketplace.modules.payment.enums.AiCoinTransactionDirection;
import com.travel.marketplace.modules.payment.enums.AiCoinTransactionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "ai_coin_transactions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_ai_coin_transaction_idempotency", columnNames = "idempotency_key")
    },
    indexes = {
        @Index(name = "idx_ai_coin_transactions_user_created", columnList = "user_id, created_at"),
        @Index(name = "idx_ai_coin_transactions_payment", columnList = "payment_id"),
        @Index(name = "idx_ai_coin_transactions_purchase", columnList = "purchase_id"),
        @Index(name = "idx_ai_coin_transactions_source", columnList = "source_type, source_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCoinTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "wallet_id", nullable = false)
    private Long walletId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AiCoinTransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiCoinTransactionDirection direction;

    @Column(nullable = false)
    private long amount;

    @Column(name = "balance_before", nullable = false)
    private long balanceBefore;

    @Column(name = "balance_after", nullable = false)
    private long balanceAfter;

    @Column(name = "source_type", nullable = false, length = 60)
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "purchase_id")
    private Long purchaseId;

    @Column(length = 120)
    private String reference;

    @Column(length = 255)
    private String description;

    @Column(name = "idempotency_key", nullable = false, length = 180)
    private String idempotencyKey;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
