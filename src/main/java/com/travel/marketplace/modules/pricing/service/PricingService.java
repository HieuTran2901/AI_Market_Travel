package com.travel.marketplace.modules.pricing.service;

import com.travel.marketplace.modules.booking.dto.PriceBreakdownDto;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface PricingService {
    PriceBreakdownDto calculatePrice(BigDecimal basePrice, Integer quantity, LocalDate startDate, LocalDate endDate);
}
