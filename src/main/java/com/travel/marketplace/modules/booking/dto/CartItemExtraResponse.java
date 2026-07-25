package com.travel.marketplace.modules.booking.dto;

import com.travel.marketplace.modules.listing.enums.ExtraServicePricingUnit;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartItemExtraResponse {
    private Long id;
    private Long extraServiceId;
    private String name;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    private String currency;
    private ExtraServicePricingUnit pricingUnit;
}
