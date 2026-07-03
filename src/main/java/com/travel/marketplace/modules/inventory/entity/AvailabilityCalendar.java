package com.travel.marketplace.modules.inventory.entity;

import com.travel.marketplace.modules.inventory.enums.CalendarStatus;
import com.travel.marketplace.modules.listing.entity.Listing;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "availability_calendar")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityCalendar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id")
    private Inventory inventory;

    @Column(nullable = false)
    private LocalDate date;

    @Column(precision = 14, scale = 2)
    private BigDecimal price;

    @Column(name = "total_capacity", nullable = false)
    private Integer totalCapacity;

    @Column(name = "booked_units", nullable = false)
    @Builder.Default
    private Integer bookedUnits = 0;

    @Column(name = "reserved_units", nullable = false)
    @Builder.Default
    private Integer reservedUnits = 0;

    @Column(name = "blocked_capacity", nullable = false)
    @Builder.Default
    private Integer blockedCapacity = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CalendarStatus status = CalendarStatus.AVAILABLE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
