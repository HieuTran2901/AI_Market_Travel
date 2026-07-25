package com.travel.marketplace.modules.payment.momo;

import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import org.springframework.stereotype.Component;

@Component
public class MomoResultCodeMapper {

    public PaymentStatus map(Integer resultCode) {
        if (resultCode == null) {
            return PaymentStatus.PROCESSING;
        }
        return switch (resultCode) {
            case 0 -> PaymentStatus.SUCCESS;
            case 9000, 1000, 7000, 7002 -> PaymentStatus.PROCESSING;
            case 1005 -> PaymentStatus.EXPIRED;
            case 1006, 1017 -> PaymentStatus.CANCELLED;
            default -> PaymentStatus.FAILED;
        };
    }
}
