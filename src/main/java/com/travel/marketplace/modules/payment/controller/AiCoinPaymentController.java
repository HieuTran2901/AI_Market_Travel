package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.payment.dto.AiCoinPaymentRequest;
import com.travel.marketplace.modules.payment.dto.AiCoinPaymentResponse;
import com.travel.marketplace.modules.payment.dto.AiCoinPaymentStatusResponse;
import com.travel.marketplace.modules.payment.dto.AiCoinMomoReturnRequest;
import com.travel.marketplace.modules.payment.dto.AiCoinTransactionResponse;
import com.travel.marketplace.modules.payment.dto.AiCoinWalletResponse;
import com.travel.marketplace.modules.payment.entity.AiCoinPurchase;
import com.travel.marketplace.modules.payment.repository.AiCoinPurchaseRepository;
import com.travel.marketplace.modules.payment.service.AiCoinPaymentService;
import com.travel.marketplace.modules.payment.service.AiCoinWalletService;
import com.travel.marketplace.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai-coins")
@RequiredArgsConstructor
public class AiCoinPaymentController {

    private final AiCoinPaymentService aiCoinPaymentService;
    private final AiCoinWalletService aiCoinWalletService;
    private final AiCoinPurchaseRepository aiCoinPurchaseRepository;

    @GetMapping("/wallet")
    public ResponseEntity<ApiResponse<AiCoinWalletResponse>> getWallet(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AiCoinWalletResponse response = aiCoinWalletService.getBalance(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<AiCoinTransactionResponse>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);
        Page<AiCoinTransactionResponse> response = aiCoinWalletService.getTransactions(
                principal.getId(),
                PageRequest.of(safePage, safeSize)
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/purchases/payments")
    public ResponseEntity<ApiResponse<AiCoinPaymentResponse>> createPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiCoinPaymentRequest request
    ) {
        AiCoinPaymentResponse response = aiCoinPaymentService.createPayment(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/purchases/{purchaseId}")
    public ResponseEntity<ApiResponse<AiCoinPurchase>> getPurchase(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long purchaseId
    ) {
        AiCoinPurchase purchase = aiCoinPurchaseRepository.findById(purchaseId)
                .filter(p -> p.getUserId().equals(principal.getId()))
                .orElseThrow(() -> new IllegalArgumentException("AI_COIN_PURCHASE_NOT_FOUND"));
        return ResponseEntity.ok(ApiResponse.success(purchase));
    }

    @GetMapping("/payments/{paymentId}/status")
    public ResponseEntity<ApiResponse<AiCoinPaymentStatusResponse>> getPaymentStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long paymentId
    ) {
        AiCoinPaymentStatusResponse response = aiCoinPaymentService.getPaymentStatus(principal.getId(), paymentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/payments/momo/return")
    public ResponseEntity<ApiResponse<AiCoinPaymentStatusResponse>> processMoMoReturn(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiCoinMomoReturnRequest request
    ) {
        AiCoinPaymentStatusResponse response = aiCoinPaymentService.processMoMoReturn(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
