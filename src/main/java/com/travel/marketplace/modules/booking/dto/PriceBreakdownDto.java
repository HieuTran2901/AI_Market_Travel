package com.travel.marketplace.modules.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceBreakdownDto {
    private BigDecimal basePrice;
    private BigDecimal subtotal;
    private BigDecimal extrasAmount;
    private BigDecimal serviceFee;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal finalTotal;
}
