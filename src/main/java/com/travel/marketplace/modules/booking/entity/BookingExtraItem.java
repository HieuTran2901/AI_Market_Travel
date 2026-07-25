package com.travel.marketplace.modules.booking.entity;

import com.travel.marketplace.modules.listing.entity.ListingExtraService;
import com.travel.marketplace.modules.listing.enums.ExtraServicePricingUnit;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "booking_extra_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"booking", "extraService"})
@EqualsAndHashCode(exclude = {"booking", "extraService"})
public class BookingExtraItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extra_service_id", nullable = false)
    private ListingExtraService extraService;

    @Column(name = "service_name_snapshot", nullable = false, length = 160)
    private String serviceNameSnapshot;

    @Column(name = "unit_price_snapshot", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPriceSnapshot;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_unit", nullable = false, length = 30)
    private ExtraServicePricingUnit pricingUnit;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "line_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal lineTotal;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
