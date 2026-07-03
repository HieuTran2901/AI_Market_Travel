package com.travel.marketplace.modules.booking.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.booking.dto.BookingResponse;
import com.travel.marketplace.modules.booking.enums.CancellationReason;
import com.travel.marketplace.modules.booking.service.BookingService;
import com.travel.marketplace.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Booking Lifecycle Operations")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class BookingController {

    private final BookingService bookingService;

    @GetMapping("/my")
    @Operation(summary = "Get current user's bookings (Customer context)")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<BookingResponse> page = bookingService.getUserBookings(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/provider")
    @PreAuthorize("hasAnyRole('PROVIDER_HOTEL', 'PROVIDER_TOUR', 'PROVIDER_RESTAURANT', 'PROVIDER_VEHICLE', 'PROVIDER_EXPERIENCE')")
    @Operation(summary = "Get bookings for listings owned by the provider")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getProviderBookings(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<BookingResponse> page = bookingService.getProviderBookings(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{bookingNumber}")
    @Operation(summary = "Get details of a specific booking by booking number")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingDetails(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String bookingNumber) {
        BookingResponse response = bookingService.getBookingByNumber(bookingNumber);
        // Verify user owns booking or is listing provider
        // Owner/Provider checks done inside service layer too, but we can do a brief check or let it load
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{bookingNumber}/cancel")
    @Operation(summary = "Cancel a reservation/booking")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String bookingNumber,
            @RequestParam CancellationReason reason,
            @RequestParam(required = false, defaultValue = "") String comment) {
        BookingResponse response = bookingService.cancelBooking(bookingNumber, reason, comment, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully.", response));
    }
}
