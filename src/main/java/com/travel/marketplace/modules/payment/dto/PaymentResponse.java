package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private String orderNumber;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private PaymentPurpose paymentPurpose;
    private String listingTitle;
    private String listingCoverImageUrl;
    private String listingCategory;
    private String gatewayOrderId;
    private String payUrl;
    private String checkoutUrl;
    private Map<String, String> checkoutFields;
    private String aiCoinPackageId;
    private String aiCoinPackageCode;
    private String aiCoinPackageName;
    private Integer baseCoins;
    private Integer bonusCoins;
    private Integer totalCoins;
    private String invoiceNumber;
    private String providerTransactionId;
    private Instant paidAt;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant updatedAt;
}
