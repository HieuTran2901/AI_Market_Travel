package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.payment.dto.SettlementResponse;
import com.travel.marketplace.modules.payment.entity.Settlement;
import com.travel.marketplace.modules.payment.mapper.SettlementMapper;
import com.travel.marketplace.modules.payment.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;
    private final SettlementMapper settlementMapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SettlementResponse> createSettlement(
            @RequestParam Long providerId,
            @RequestParam BigDecimal grossAmount,
            @RequestParam BigDecimal platformFee,
            @RequestParam BigDecimal taxAmount,
            @RequestParam Instant periodStart,
            @RequestParam Instant periodEnd) {
            
        Settlement settlement = settlementService.createSettlement(
                providerId, grossAmount, platformFee, taxAmount, periodStart, periodEnd);
        return ApiResponse.success("Settlement created successfully", settlementMapper.toResponse(settlement));
    }

    @GetMapping("/provider/{providerId}")
    public ApiResponse<List<SettlementResponse>> getSettlementsByProvider(@PathVariable Long providerId) {
        List<Settlement> settlements = settlementService.getSettlementsByProvider(providerId);
        return ApiResponse.success("Settlements retrieved successfully", settlements.stream().map(settlementMapper::toResponse).toList());
    }

    @PostMapping("/{id}/process")
    public ApiResponse<SettlementResponse> processSettlement(@PathVariable Long id) {
        Settlement settlement = settlementService.processSettlement(id);
        return ApiResponse.success("Settlement marked as processing", settlementMapper.toResponse(settlement));
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<SettlementResponse> completeSettlement(@PathVariable Long id) {
        Settlement settlement = settlementService.completeSettlement(id);
        return ApiResponse.success("Settlement completed successfully", settlementMapper.toResponse(settlement));
    }

    @PostMapping("/{id}/fail")
    public ApiResponse<SettlementResponse> failSettlement(@PathVariable Long id) {
        Settlement settlement = settlementService.failSettlement(id);
        return ApiResponse.success("Settlement marked as failed", settlementMapper.toResponse(settlement));
    }
}
