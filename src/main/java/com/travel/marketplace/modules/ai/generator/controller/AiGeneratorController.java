package com.travel.marketplace.modules.ai.generator.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.ai.generator.dto.ListingGenerationRequest;
import com.travel.marketplace.modules.ai.generator.dto.ListingGenerationResponse;
import com.travel.marketplace.modules.ai.generator.service.AiGeneratorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/provider")
@Tag(name = "AI Provider Generator", description = "AI capabilities for Providers")
@RequiredArgsConstructor
public class AiGeneratorController {

    private final AiGeneratorService aiGeneratorService;

    @PostMapping("/generate-listing")
    @PreAuthorize("hasAnyRole('PROVIDER_HOTEL', 'PROVIDER_TOUR', 'PROVIDER_RESTAURANT', 'PROVIDER_VEHICLE', 'PROVIDER_EXPERIENCE') or hasRole('CUSTOMER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Generate a listing using AI", description = "Returns generated listing fields formatted as JSON")
    public ResponseEntity<ApiResponse<ListingGenerationResponse>> generateListing(
            @Valid @RequestBody ListingGenerationRequest request) {
        
        ListingGenerationResponse response = aiGeneratorService.generateListing(request);
        return ResponseEntity.ok(ApiResponse.success("Listing generated successfully", response));
    }
}
