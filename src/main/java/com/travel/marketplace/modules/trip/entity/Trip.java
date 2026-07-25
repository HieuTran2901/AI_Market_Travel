package com.travel.marketplace.modules.trip.entity;

import com.travel.marketplace.modules.trip.enums.TripSource;
import com.travel.marketplace.modules.trip.enums.TripStatus;
import com.travel.marketplace.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trips", indexes = {
        @Index(name = "idx_trips_user_status", columnList = "user_id,status"),
        @Index(name = "idx_trips_slug", columnList = "slug")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 240)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 120)
    private String destination;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "duration_nights", nullable = false)
    private Integer durationNights;

    @Column(name = "traveler_count", nullable = false)
    private Integer travelerCount;

    @Column(precision = 14, scale = 2)
    private BigDecimal budget;

    @Column(name = "estimated_cost", precision = 14, scale = 2)
    private BigDecimal estimatedCost;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "VND";

    @Column(length = 1000)
    private String summary;

    @Column(name = "hero_image_url", length = 500)
    private String heroImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TripStatus status = TripStatus.UPCOMING;

    @Enumerated(EnumType.STRING)
    @Column(name = "created_source", nullable = false, length = 30)
    @Builder.Default
    private TripSource createdSource = TripSource.AI;

    @Column(name = "ai_draft_id", unique = true, length = 36)
    private String aiDraftId;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC")
    @BatchSize(size = 20)
    @Builder.Default
    private List<TripDay> days = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public void addDay(TripDay day) {
        day.setTrip(this);
        days.add(day);
    }
}
