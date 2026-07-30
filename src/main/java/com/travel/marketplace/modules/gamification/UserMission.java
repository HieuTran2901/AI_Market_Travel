package com.travel.marketplace.modules.gamification;

import com.travel.marketplace.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_missions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "mission_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "mission_id", nullable = false)
    private String missionId;

    @Column(name = "category")
    private String category;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "reward_coins", nullable = false)
    private Integer rewardCoins;

    @Column(name = "reward_exp", nullable = false)
    private Integer rewardExp = 0;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
