package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.modules.booking.entity.Booking;
import com.travel.marketplace.modules.booking.entity.BookingHistory;
import com.travel.marketplace.modules.booking.entity.Order;
import com.travel.marketplace.modules.booking.enums.BookingStatus;
import com.travel.marketplace.modules.booking.enums.OrderStatus;
import com.travel.marketplace.modules.booking.repository.BookingHistoryRepository;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.booking.repository.OrderRepository;
import com.travel.marketplace.modules.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseReservationLockManager implements ReservationLockManager {

    private final BookingRepository bookingRepository;
    private final BookingHistoryRepository bookingHistoryRepository;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    @Override
    @Transactional
    public void lock(Booking booking, long ttlMinutes) {
        booking.setStatus(BookingStatus.RESERVED);
        booking.setExpiresAt(Instant.now().plus(Duration.ofMinutes(ttlMinutes)));
        bookingRepository.save(booking);

        // Reserve inventory in calendar
        inventoryService.reserveInventory(
                booking.getListing().getId(),
                booking.getInventory() != null ? booking.getInventory().getId() : null,
                booking.getStartDate(),
                booking.getEndDate(),
                booking.getQuantity()
        );

        // Log history
        bookingHistoryRepository.save(BookingHistory.builder()
                .booking(booking)
                .fromStatus(BookingStatus.PENDING.name())
                .toStatus(BookingStatus.RESERVED.name())
                .notes("Inventory locked for " + ttlMinutes + " minutes.")
                .build());
    }

    @Override
    @Transactional
    public void release(Booking booking) {
        if (booking.getStatus() == BookingStatus.RESERVED) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.setExpiresAt(null);
            bookingRepository.save(booking);

            // Release inventory in calendar
            inventoryService.releaseInventory(
                    booking.getListing().getId(),
                    booking.getInventory() != null ? booking.getInventory().getId() : null,
                    booking.getStartDate(),
                    booking.getEndDate(),
                    booking.getQuantity()
            );

            // Log history
            bookingHistoryRepository.save(BookingHistory.builder()
                    .booking(booking)
                    .fromStatus(BookingStatus.RESERVED.name())
                    .toStatus(BookingStatus.EXPIRED.name())
                    .notes("Reservation lock released.")
                    .build());
        }
    }

    @Override
    @Transactional
    public void expireLocks() {
        Instant now = Instant.now();
        List<Booking> expiredBookings = bookingRepository.findAllByStatusAndExpiresAtBefore(BookingStatus.RESERVED, now);

        if (expiredBookings.isEmpty()) {
            return;
        }

        log.info("Found {} expired booking reservations. Expiring them now...", expiredBookings.size());

        for (Booking booking : expiredBookings) {
            release(booking);

            // Update parent order status if all bookings are expired/failed/cancelled
            Order order = booking.getOrder();
            boolean allFailed = order.getBookings().stream()
                    .allMatch(b -> b.getStatus() == BookingStatus.EXPIRED || b.getStatus() == BookingStatus.CANCELLED);

            if (allFailed && order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.FAILED);
                orderRepository.save(order);
                log.info("Order {} status updated to FAILED because all child bookings expired.", order.getOrderNumber());
            }
        }
    }
}
