package com.travel.marketplace.modules.payment.entity;

import com.travel.marketplace.modules.payment.enums.AiCoinPurchaseStatus;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "ai_coin_purchases",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_ai_coin_purchase_idempotency",
            columnNames = {"user_id", "idempotency_key"}
        )
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCoinPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "package_id", nullable = false, length = 50)
    private String packageId;

    @Column(name = "package_code", nullable = false, length = 50)
    private String packageCode;

    @Column(name = "base_coins", nullable = false)
    private Integer baseCoins;

    @Column(name = "bonus_coins", nullable = false)
    private Integer bonusCoins;

    @Column(name = "total_coins", nullable = false)
    private Integer totalCoins;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AiCoinPurchaseStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    private PaymentMethod paymentMethod;

    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "merchant_order_id", unique = true, length = 100)
    private String merchantOrderId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public void markCredited() {
        this.status = AiCoinPurchaseStatus.CREDITED;
        this.completedAt = Instant.now();
    }
    
    public void markFailed() {
        this.status = AiCoinPurchaseStatus.FAILED;
    }
}
