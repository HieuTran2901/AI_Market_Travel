package com.travel.marketplace.modules.trip.entity;

import com.travel.marketplace.modules.listing.entity.Listing;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "trip_activities")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_day_id", nullable = false)
    private TripDay day;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "time_of_day", nullable = false, length = 30)
    private String timeOfDay;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private Listing listing;

    @Column(name = "estimated_cost", precision = 14, scale = 2)
    private BigDecimal estimatedCost;
}
