package com.travel.marketplace.modules.listing.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Hub entity for Hotel listings.
 * Connects the base Listing with hotel-specific properties.
 * Phase 3 will attach Rooms to this entity.
 */
@Entity
@Table(name = "hotel_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "listing")
@EqualsAndHashCode(exclude = "listing")
public class HotelDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    @JsonIgnore
    private Listing listing;

    @Column(name = "star_rating")
    private Byte starRating;

    @Column(name = "total_rooms")
    private Integer totalRooms;

    @Column(name = "check_in_time", length = 10)
    private String checkInTime;

    @Column(name = "check_out_time", length = 10)
    private String checkOutTime;

    // Amenities
    @Column(name = "has_pool", nullable = false)
    @Builder.Default
    private Boolean hasPool = false;

    @Column(name = "has_spa", nullable = false)
    @Builder.Default
    private Boolean hasSpa = false;

    @Column(name = "has_gym", nullable = false)
    @Builder.Default
    private Boolean hasGym = false;

    @Column(name = "has_restaurant", nullable = false)
    @Builder.Default
    private Boolean hasRestaurant = false;

    @Column(name = "has_free_wifi", nullable = false)
    @Builder.Default
    private Boolean hasFreeWifi = true;

    @Column(name = "has_parking", nullable = false)
    @Builder.Default
    private Boolean hasParking = false;

    @Column(name = "pet_friendly", nullable = false)
    @Builder.Default
    private Boolean petFriendly = false;
}
