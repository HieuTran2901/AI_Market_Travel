package com.travel.marketplace.modules.listing.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Hub entity for Restaurant listings.
 * Connects the base Listing with restaurant-specific properties.
 * Phase 3 will attach RestaurantTables to this entity.
 */
@Entity
@Table(name = "restaurant_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "listing")
@EqualsAndHashCode(exclude = "listing")
public class RestaurantDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    @JsonIgnore
    private Listing listing;

    @Column(name = "cuisine_type", length = 100)
    private String cuisineType;

    @Column(name = "seating_capacity")
    private Integer seatingCapacity;

    @Column(name = "opening_hours", length = 500)
    private String openingHours;

    @Column(name = "price_range", length = 10)
    private String priceRange;

    @Column(name = "has_delivery", nullable = false)
    @Builder.Default
    private Boolean hasDelivery = false;

    @Column(name = "has_dine_in", nullable = false)
    @Builder.Default
    private Boolean hasDineIn = true;

    @Column(name = "has_takeaway", nullable = false)
    @Builder.Default
    private Boolean hasTakeaway = false;

    @Column(name = "has_reservations", nullable = false)
    @Builder.Default
    private Boolean hasReservations = false;

    @Column(name = "halal_certified", nullable = false)
    @Builder.Default
    private Boolean halalCertified = false;

    @Column(name = "vegetarian_friendly", nullable = false)
    @Builder.Default
    private Boolean vegetarianFriendly = false;
}
