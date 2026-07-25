package com.travel.marketplace.modules.payment.statemachine;

import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import org.springframework.stereotype.Component;

import java.util.EnumSet;

@Component
public class PaymentStateMachine {

    public void transitionTo(Payment payment, PaymentStatus newStatus) {
        PaymentStatus currentStatus = payment.getStatus();
        
        if (currentStatus == newStatus) {
            return; // No-op if same status
        }

        if (!isValidTransition(currentStatus, newStatus)) {
            throw new IllegalStateException("Invalid payment status transition from " + currentStatus + " to " + newStatus);
        }

        payment.setStatus(newStatus);
    }

    private boolean isValidTransition(PaymentStatus currentStatus, PaymentStatus newStatus) {
        if (currentStatus == null) {
            return newStatus == PaymentStatus.PENDING;
        }

        return switch (currentStatus) {
            case PENDING -> EnumSet.of(PaymentStatus.PROCESSING, PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.EXPIRED).contains(newStatus);
            case PROCESSING -> EnumSet.of(
                    PaymentStatus.SUCCESS,
                    PaymentStatus.FAILED,
                    PaymentStatus.CANCELLED,
                    PaymentStatus.EXPIRED
            ).contains(newStatus);
            case SUCCESS -> EnumSet.of(PaymentStatus.REFUNDED).contains(newStatus);
            case FAILED, CANCELLED, REFUNDED, EXPIRED -> false; // Terminal states
        };
    }
}
