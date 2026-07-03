package com.travel.marketplace.modules.listing.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Hub entity for Vehicle Rental listings.
 * Connects the base Listing with vehicle-specific properties.
 * Phase 3 will attach VehicleAvailability to this entity.
 */
@Entity
@Table(name = "vehicle_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "listing")
@EqualsAndHashCode(exclude = "listing")
public class VehicleDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    @JsonIgnore
    private Listing listing;

    @Column(name = "vehicle_type", nullable = false, length = 20)
    private String vehicleType; // CAR, MOTORBIKE, BUS, VAN, BOAT, OTHER

    @Column(length = 100)
    private String brand;

    @Column(length = 100)
    private String model;

    @Column(name = "manufacture_year")
    private Integer manufactureYear;

    private Integer seats;

    @Column(name = "fuel_type", length = 20)
    @Builder.Default
    private String fuelType = "PETROL"; // PETROL, DIESEL, ELECTRIC, HYBRID

    @Column(length = 20)
    @Builder.Default
    private String transmission = "AUTOMATIC"; // AUTOMATIC, MANUAL

    @Column(name = "has_driver", nullable = false)
    @Builder.Default
    private Boolean hasDriver = false;

    @Column(name = "requires_license", nullable = false)
    @Builder.Default
    private Boolean requiresLicense = true;

    @Column(name = "min_rental_days", nullable = false)
    @Builder.Default
    private Integer minRentalDays = 1;
}
