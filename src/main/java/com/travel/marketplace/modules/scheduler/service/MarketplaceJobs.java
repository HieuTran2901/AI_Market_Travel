package com.travel.marketplace.modules.scheduler.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketplaceJobs {

    private final JobExecutionTracker jobExecutionTracker;
    
    // Replace with real service injects when available:
    // private final BookingService bookingService;
    // private final PaymentService paymentService;
    // private final SettlementService settlementService;

    /**
     * Runs every 5 minutes to release expired unconfirmed bookings.
     */
    @Scheduled(fixedRate = 300000)
    public void releaseExpiredBookings() {
        jobExecutionTracker.trackAndExecute("BookingExpiryJob", () -> {
            log.info("Executing BookingExpiryJob...");
            // bookingService.releaseExpiredLocks();
        });
    }

    /**
     * Runs every 15 minutes to clean up abandoned payments.
     */
    @Scheduled(fixedRate = 900000)
    public void cleanupAbandonedPayments() {
        jobExecutionTracker.trackAndExecute("PaymentExpiryJob", () -> {
            log.info("Executing PaymentExpiryJob...");
            // paymentService.expirePendingPayments();
        });
    }

    /**
     * Runs at 1 AM every day to process settlements.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void processSettlements() {
        jobExecutionTracker.trackAndExecute("SettlementJob", () -> {
            log.info("Executing SettlementJob...");
            // settlementService.processPendingSettlements();
        });
    }
}
