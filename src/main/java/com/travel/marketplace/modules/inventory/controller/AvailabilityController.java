package com.travel.marketplace.modules.inventory.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.inventory.entity.AvailabilityCalendar;
import com.travel.marketplace.modules.inventory.dto.InventoryUpdateRequest;
import com.travel.marketplace.modules.inventory.service.InventoryService;
import com.travel.marketplace.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/availability")
@RequiredArgsConstructor
@Tag(name = "Availability", description = "Availability Calendar Operations")
public class AvailabilityController {

    private final InventoryService inventoryService;

    @GetMapping("/{listingId}")
    @Operation(summary = "Get availability calendar for a listing (Public)")
    public ResponseEntity<ApiResponse<List<AvailabilityCalendar>>> getAvailability(
            @PathVariable Long listingId,
            @RequestParam(required = false) Long inventoryId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AvailabilityCalendar> availability = inventoryService.getAvailability(listingId, inventoryId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(availability));
    }

    @PutMapping("/{listingId}")
    @PreAuthorize("hasAnyRole('PROVIDER_HOTEL', 'PROVIDER_TOUR', 'PROVIDER_RESTAURANT', 'PROVIDER_VEHICLE', 'PROVIDER_EXPERIENCE')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Set date/price capacity overrides or block slots (Provider only)")
    public ResponseEntity<ApiResponse<Void>> updateAvailability(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long listingId,
            @RequestBody List<InventoryUpdateRequest> requests) {
        // Validation could be added here to ensure the provider owns the listing
        for (InventoryUpdateRequest req : requests) {
            inventoryService.updateAvailability(
                    listingId,
                    req.getInventoryId(),
                    req.getDate(),
                    req.getPriceOverride(),
                    req.getTotalCapacity(),
                    req.isBlocked()
            );
        }
        return ResponseEntity.ok(ApiResponse.success("Availability updated successfully.", null));
    }
}
