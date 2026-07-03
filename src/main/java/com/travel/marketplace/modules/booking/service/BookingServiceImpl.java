package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.booking.dto.BookingResponse;
import com.travel.marketplace.modules.booking.entity.Booking;
import com.travel.marketplace.modules.booking.entity.BookingCancellation;
import com.travel.marketplace.modules.booking.entity.BookingHistory;
import com.travel.marketplace.modules.booking.enums.BookingStatus;
import com.travel.marketplace.modules.booking.enums.CancellationReason;
import com.travel.marketplace.modules.booking.mapper.BookingMapper;
import com.travel.marketplace.modules.booking.repository.BookingCancellationRepository;
import com.travel.marketplace.modules.booking.repository.BookingHistoryRepository;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final BookingHistoryRepository bookingHistoryRepository;
    private final BookingCancellationRepository bookingCancellationRepository;
    private final InventoryService inventoryService;
    private final BookingMapper bookingMapper;

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByNumber(String bookingNumber) {
        Booking booking = bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingNumber));
        return bookingMapper.toBookingResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getUserBookings(Long userId, Pageable pageable) {
        return bookingRepository.findAllByOrderUserId(userId, pageable)
                .map(bookingMapper::toBookingResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getProviderBookings(Long providerId, Pageable pageable) {
        return bookingRepository.findAllByListingProviderId(providerId, pageable)
                .map(bookingMapper::toBookingResponse);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(String bookingNumber, CancellationReason reason, String comment, Long userId) {
        Booking booking = bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingNumber));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled.");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel a completed booking.");
        }

        // Verify ownership (either user who ordered, or provider of the listing)
        boolean isUser = booking.getOrder().getUser().getId().equals(userId);
        boolean isProvider = booking.getListing().getProvider().getUser().getId().equals(userId);

        if (!isUser && !isProvider) {
            throw new BadRequestException("You are not authorized to cancel this booking.");
        }

        BookingStatus oldStatus = booking.getStatus();

        // Release inventory
        Long invId = booking.getInventory() != null ? booking.getInventory().getId() : null;
        if (oldStatus == BookingStatus.RESERVED) {
            inventoryService.releaseInventory(
                    booking.getListing().getId(),
                    invId,
                    booking.getStartDate(),
                    booking.getEndDate(),
                    booking.getQuantity()
            );
        } else if (oldStatus == BookingStatus.CONFIRMED) {
            inventoryService.releaseConfirmedInventory(
                    booking.getListing().getId(),
                    invId,
                    booking.getStartDate(),
                    booking.getEndDate(),
                    booking.getQuantity()
            );
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        // Record cancellation details
        BookingCancellation cancellation = BookingCancellation.builder()
                .booking(booking)
                .reason(reason)
                .comment(comment)
                .refundAmount(booking.getFinalTotal()) // Full refund for now
                .requestedAt(Instant.now())
                .processedAt(Instant.now())
                .build();
        bookingCancellationRepository.save(cancellation);

        // Record history
        bookingHistoryRepository.save(BookingHistory.builder()
                .booking(booking)
                .fromStatus(oldStatus.name())
                .toStatus(BookingStatus.CANCELLED.name())
                .notes("Cancelled via api. Reason: " + reason.name())
                .build());

        return bookingMapper.toBookingResponse(booking);
    }
}
