package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.modules.booking.dto.BookingResponse;
import com.travel.marketplace.modules.booking.enums.CancellationReason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingService {
    BookingResponse getBookingByNumber(String bookingNumber);
    Page<BookingResponse> getUserBookings(Long userId, Pageable pageable);
    Page<BookingResponse> getProviderBookings(Long providerId, Pageable pageable);
    BookingResponse cancelBooking(String bookingNumber, CancellationReason reason, String comment, Long userId);
}
