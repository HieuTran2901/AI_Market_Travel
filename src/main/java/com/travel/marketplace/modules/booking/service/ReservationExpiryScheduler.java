package com.travel.marketplace.modules.booking.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpiryScheduler {

    private final ReservationLockManager reservationLockManager;

    @Scheduled(fixedRate = 60000) // every 60 seconds
    public void checkExpiredReservations() {
        log.debug("Running ReservationExpiryScheduler to check for expired locks...");
        try {
            reservationLockManager.expireLocks();
        } catch (Exception e) {
            log.error("Error occurred while expiring reservation locks: ", e);
        }
    }
}
