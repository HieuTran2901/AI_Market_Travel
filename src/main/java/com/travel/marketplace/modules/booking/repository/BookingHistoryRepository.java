package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.BookingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingHistoryRepository extends JpaRepository<BookingHistory, Long> {
    List<BookingHistory> findAllByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
