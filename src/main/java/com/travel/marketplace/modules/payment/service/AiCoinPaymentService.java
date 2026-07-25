package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.modules.payment.catalog.AiCoinPackageCatalog;
import com.travel.marketplace.modules.payment.dto.AiCoinPaymentRequest;
import com.travel.marketplace.modules.payment.dto.AiCoinPaymentResponse;
import com.travel.marketplace.modules.payment.dto.AiCoinMomoReturnRequest;
import com.travel.marketplace.modules.payment.entity.AiCoinPurchase;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import com.travel.marketplace.modules.payment.enums.AiCoinPurchaseStatus;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.gateway.GatewayResponse;
import com.travel.marketplace.modules.payment.gateway.MomoPaymentGateway;
import com.travel.marketplace.modules.payment.repository.AiCoinPurchaseRepository;
import com.travel.marketplace.modules.payment.repository.PaymentRepository;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.travel.marketplace.modules.payment.dto.AiCoinPaymentStatusResponse;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCoinPaymentService {

    private final AiCoinPurchaseRepository aiCoinPurchaseRepository;
    private final PaymentRepository paymentRepository;
    private final MomoPaymentGateway momoPaymentGateway;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public AiCoinPaymentResponse createPayment(Long userId, AiCoinPaymentRequest request) {
        if (request.getPaymentMethod() != PaymentMethod.MOMO) {
            throw new IllegalArgumentException("Only MOMO is currently supported for AI Coin purchases");
        }

        AiCoinPackageCatalog.PackageDef pkg = AiCoinPackageCatalog.getPackageById(request.getPackageId())
                .orElseThrow(() -> new IllegalArgumentException("AI_COIN_PACKAGE_NOT_FOUND"));

        // Check Idempotency
        Optional<AiCoinPurchase> existing = aiCoinPurchaseRepository.findByIdempotencyKeyAndUserId(request.getIdempotencyKey(), userId);
        if (existing.isPresent()) {
            AiCoinPurchase purchase = existing.get();
            // If already created, try to find existing payment response if still pending
            Payment payment = paymentRepository.findByPurposeAndReferenceId(PaymentPurpose.AI_COIN_PURCHASE, purchase.getId())
                    .orElseThrow(() -> new IllegalStateException("Payment missing for idempotent purchase"));
            
            PaymentTransaction transaction = paymentTransactionRepository.findByPaymentIdOrderByCreatedAtDesc(payment.getId()).stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("Transaction missing for idempotent payment"));

            return AiCoinPaymentResponse.builder()
                    .purchaseId(purchase.getId())
                    .paymentId(payment.getId())
                    .transactionId(transaction.getTransactionId())
                    .status(purchase.getStatus().name())
                    .paymentMethod(purchase.getPaymentMethod())
                    .amount(purchase.getTotalAmount())
                    .currency(purchase.getCurrency())
                    .paymentUrl(transaction.getPayUrl())
                    .build();
        }

        // Apply discount if promo valid (simplification: assume no promo logic for now)
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = pkg.getPrice().subtract(discountAmount);

        AiCoinPurchase purchase = AiCoinPurchase.builder()
                .userId(userId)
                .packageId(pkg.getId())
                .packageCode(pkg.getCode())
                .baseCoins(pkg.getBaseCoins())
                .bonusCoins(pkg.getBonusCoins())
                .totalCoins(pkg.getTotalCoins())
                .subtotal(pkg.getPrice())
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .currency("VND")
                .status(AiCoinPurchaseStatus.PAYMENT_PENDING)
                .paymentMethod(request.getPaymentMethod())
                .idempotencyKey(request.getIdempotencyKey())
                .build();
        
        purchase = aiCoinPurchaseRepository.save(purchase);
        
        // Ensure merchantOrderId is generated and saved
        purchase.setMerchantOrderId("AICOIN-" + purchase.getId() + "-" + Instant.now().toEpochMilli());
        purchase = aiCoinPurchaseRepository.save(purchase);

        Payment payment = Payment.builder()
                .purpose(PaymentPurpose.AI_COIN_PURCHASE)
                .referenceId(purchase.getId())
                .amount(totalAmount)
                .currency("VND")
                .status(PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .idempotencyKey(UUID.randomUUID().toString()) // Payment-level idempotency
                .build();
        payment = paymentRepository.saveAndFlush(payment);

        GatewayResponse gatewayResponse = momoPaymentGateway.processPayment(payment);

        Map<String, Object> raw = gatewayResponse.getRawResponse();
        String paymentUrl = raw != null && raw.containsKey("payUrl") ? (String) raw.get("payUrl") : null;
        String deeplink = raw != null && raw.containsKey("deeplink") ? (String) raw.get("deeplink") : null;
        String qrCodeUrl = raw != null && raw.containsKey("qrCodeUrl") ? (String) raw.get("qrCodeUrl") : null;

        log.info("AI Coin MoMo payment created: purchaseId={} paymentId={} hasPayUrl={} hasDeeplink={} hasQrCode={}",
                purchase.getId(), payment.getId(), paymentUrl != null, deeplink != null, qrCodeUrl != null);

        return AiCoinPaymentResponse.builder()
                .purchaseId(purchase.getId())
                .paymentId(payment.getId())
                .status(purchase.getStatus().name())
                .paymentMethod(purchase.getPaymentMethod())
                .amount(purchase.getTotalAmount())
                .currency(purchase.getCurrency())
                .paymentUrl(paymentUrl)
                .deeplink(deeplink)
                .qrCodeUrl(qrCodeUrl)
                .build();
    }

    @Transactional
    public void handlePaymentStatusUpdate(Long paymentId, PaymentStatus targetStatus) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == targetStatus) {
            return; // Already processed
        }

        payment.setStatus(targetStatus);
        paymentRepository.save(payment);

        AiCoinPurchase purchase = aiCoinPurchaseRepository.findById(payment.getReferenceId())
                .orElseThrow(() -> new IllegalArgumentException("AI Coin Purchase not found"));

        if (purchase.getStatus() == AiCoinPurchaseStatus.CREDITED) {
            return; // Already credited
        }

        if (targetStatus == PaymentStatus.SUCCESS) {
            User user = userRepository.findById(purchase.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            user.setAiCoinBalance(user.getAiCoinBalance() + purchase.getTotalCoins());
            userRepository.save(user);

            purchase.markCredited();
            log.info("AI Coins credited: purchaseId={} userId={} totalCoins={}", purchase.getId(), user.getId(), purchase.getTotalCoins());
        } else if (targetStatus == PaymentStatus.FAILED || targetStatus == PaymentStatus.CANCELLED) {
            purchase.markFailed();
        }
        
        aiCoinPurchaseRepository.save(purchase);
    }

    @Transactional(readOnly = true)
    public AiCoinPaymentStatusResponse getPaymentStatus(Long userId, Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (payment.getPurpose() != PaymentPurpose.AI_COIN_PURCHASE) {
            throw new IllegalArgumentException("Payment is not an AI Coin purchase");
        }

        AiCoinPurchase purchase = aiCoinPurchaseRepository.findById(payment.getReferenceId())
                .orElseThrow(() -> new IllegalArgumentException("AI Coin Purchase not found"));

        if (!purchase.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Payment does not belong to this user");
        }

        Integer gatewayResultCode = paymentTransactionRepository
                .findByPaymentIdOrderByCreatedAtDesc(payment.getId())
                .stream().findFirst()
                .map(t -> t.getResultCode())
                .orElse(null);

        return AiCoinPaymentStatusResponse.builder()
                .paymentId(payment.getId())
                .purchaseId(purchase.getId())
                .status(payment.getStatus().name())
                .purchaseStatus(purchase.getStatus().name())
                .credited(purchase.getStatus() == AiCoinPurchaseStatus.CREDITED)
                .amount(purchase.getTotalAmount())
                .currency(purchase.getCurrency())
                .gatewayResultCode(gatewayResultCode)
                .baseCoins(purchase.getBaseCoins())
                .bonusCoins(purchase.getBonusCoins())
                .totalCoins(purchase.getTotalCoins())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    @Transactional
    public AiCoinPaymentStatusResponse processMoMoReturn(Long userId, AiCoinMomoReturnRequest request) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (payment.getPurpose() != PaymentPurpose.AI_COIN_PURCHASE) {
            throw new IllegalArgumentException("Payment is not an AI Coin purchase");
        }

        AiCoinPurchase purchase = aiCoinPurchaseRepository.findById(payment.getReferenceId())
                .orElseThrow(() -> new IllegalArgumentException("AI Coin Purchase not found"));

        if (!purchase.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Payment does not belong to this user");
        }

        // Only reconcile if it's currently pending or if we are explicitly marking it cancelled/failed.
        // We never override a SUCCESS/CREDITED status with a cancellation just because of a late return.
        if (payment.getStatus() == PaymentStatus.PENDING) {
            Integer resultCode = request.getResultCode();
            String message = request.getMessage() != null ? request.getMessage().toLowerCase() : "";
            boolean isCancelled = (resultCode != null && (resultCode == 1006 || resultCode == 1005)) ||
                    message.contains("cancel") || message.contains("reject") || message.contains("decline");

            boolean isFailed = (resultCode != null && resultCode != 0 && !isCancelled);

            if (isCancelled) {
                log.info("Processing MoMo return: CANCELLED for paymentId={}", payment.getId());
                handlePaymentStatusUpdate(payment.getId(), PaymentStatus.CANCELLED);
            } else if (isFailed) {
                log.info("Processing MoMo return: FAILED for paymentId={}", payment.getId());
                handlePaymentStatusUpdate(payment.getId(), PaymentStatus.FAILED);
            }
        }

        return getPaymentStatus(userId, payment.getId());
    }
}
