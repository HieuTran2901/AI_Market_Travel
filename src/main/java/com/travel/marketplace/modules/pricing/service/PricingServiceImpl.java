package com.travel.marketplace.modules.pricing.service;

import com.travel.marketplace.modules.booking.dto.PriceBreakdownDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class PricingServiceImpl implements PricingService {

    private static final BigDecimal SERVICE_FEE_RATE = BigDecimal.valueOf(0.05); // 5%
    private static final BigDecimal TAX_RATE = BigDecimal.valueOf(0.10);        // 10%

    @Override
    public PriceBreakdownDto calculatePrice(BigDecimal basePrice, Integer quantity, LocalDate startDate, LocalDate endDate) {
        if (basePrice == null) basePrice = BigDecimal.ZERO;
        if (quantity == null || quantity <= 0) quantity = 1;

        long duration = 1;
        if (startDate != null && endDate != null && endDate.isAfter(startDate)) {
            duration = ChronoUnit.DAYS.between(startDate, endDate);
        }

        BigDecimal qtyBig = BigDecimal.valueOf(quantity);
        BigDecimal durBig = BigDecimal.valueOf(duration);

        BigDecimal subtotal = basePrice.multiply(qtyBig).multiply(durBig);
        BigDecimal serviceFee = subtotal.multiply(SERVICE_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = subtotal.add(serviceFee).multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.ZERO; // For future coupon/voucher extensions
        BigDecimal finalTotal = subtotal.add(serviceFee).add(tax).subtract(discount).setScale(2, RoundingMode.HALF_UP);

        return PriceBreakdownDto.builder()
                .basePrice(basePrice)
                .subtotal(subtotal)
                .serviceFee(serviceFee)
                .tax(tax)
                .discount(discount)
                .finalTotal(finalTotal)
                .build();
    }
}
