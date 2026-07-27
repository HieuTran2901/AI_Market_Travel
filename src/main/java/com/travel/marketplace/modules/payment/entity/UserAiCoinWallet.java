package com.travel.marketplace.modules.payment.entity;

import com.travel.marketplace.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "user_ai_coin_wallets",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_ai_coin_wallet_user", columnNames = "user_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAiCoinWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private long balance = 0L;

    @Column(name = "lifetime_earned", nullable = false)
    @Builder.Default
    private long lifetimeEarned = 0L;

    @Column(name = "lifetime_spent", nullable = false)
    @Builder.Default
    private long lifetimeSpent = 0L;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
