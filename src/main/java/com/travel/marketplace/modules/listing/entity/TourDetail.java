package com.travel.marketplace.modules.listing.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Hub entity for Tour listings.
 * Connects the base Listing with tour-specific properties.
 * Phase 3 will attach TourSchedules to this entity.
 */
@Entity
@Table(name = "tour_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "listing")
@EqualsAndHashCode(exclude = "listing")
public class TourDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    @JsonIgnore
    private Listing listing;

    @Column(name = "duration_days", nullable = false)
    @Builder.Default
    private Integer durationDays = 1;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "max_group_size")
    private Integer maxGroupSize;

    @Column(name = "min_group_size", nullable = false)
    @Builder.Default
    private Integer minGroupSize = 1;

    @Column(name = "tour_type", nullable = false, length = 20)
    @Builder.Default
    private String tourType = "GROUP"; // GROUP, PRIVATE, SELF_GUIDED

    @Column(name = "meeting_point", length = 500)
    private String meetingPoint;

    @Column(columnDefinition = "TEXT")
    private String includes;

    @Column(columnDefinition = "TEXT")
    private String excludes;

    @Column(columnDefinition = "TEXT")
    private String itinerary;
}
