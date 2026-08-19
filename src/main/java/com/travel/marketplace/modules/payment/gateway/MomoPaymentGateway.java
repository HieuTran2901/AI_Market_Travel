package com.travel.marketplace.modules.payment.gateway;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import com.travel.marketplace.modules.payment.momo.MomoClient;
import com.travel.marketplace.modules.payment.momo.MomoCreatePaymentRequest;
import com.travel.marketplace.modules.payment.momo.MomoCreatePaymentResponse;
import com.travel.marketplace.modules.payment.momo.MomoProperties;
import com.travel.marketplace.modules.payment.momo.MomoSigner;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "payment.momo", name = "enabled", havingValue = "true")
public class MomoPaymentGateway implements PaymentGateway {

    static final long MIN_AMOUNT_VND = 1_000L;
    static final long MAX_AMOUNT_VND = 50_000_000L;
    private static final String ORDER_INFO = "pay with MoMo";

    private final MomoProperties properties;
    private final MomoSigner signer;
    private final MomoClient client;
    private final PaymentTransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;

    @Override
    public GatewayResponse processPayment(Payment payment) {
        long amount = resolveAmount(payment);
        String requestId = compactId("MOMO_REQ");
        String orderId = "MOMO_ORD_" + payment.getId() + "_" + compactUuid(16);

        String targetRedirectUrl = payment.getPurpose() == com.travel.marketplace.modules.payment.enums.PaymentPurpose.AI_COIN_PURCHASE
                ? properties.getAiCoinRedirectUrl()
                : properties.getRedirectUrl();

        String endpointHost = extractHost(properties.getEndpoint());
        String redirectHost = extractHost(targetRedirectUrl);
        String ipnHost = extractHost(properties.getIpnUrl());

        log.info("Initiating MoMo payment creation for paymentId={} orderId={} amount={} endpointHost={} redirectHost={} ipnHost={}",
                payment.getId(), orderId, amount, endpointHost, redirectHost, ipnHost);

        MomoCreatePaymentRequest unsigned = new MomoCreatePaymentRequest(
                properties.getPartnerCode(),
                requestId,
                amount,
                orderId,
                ORDER_INFO,
                targetRedirectUrl,
                properties.getIpnUrl(),
                properties.getRequestType(),
                "",
                true,
                properties.getLanguage(),
                ""
        );
        String signature = signer.signCreate(unsigned, properties.getAccessKey(), properties.getSecretKey());
        MomoCreatePaymentRequest request = new MomoCreatePaymentRequest(
                unsigned.partnerCode(),
                unsigned.requestId(),
                unsigned.amount(),
                unsigned.orderId(),
                unsigned.orderInfo(),
                unsigned.redirectUrl(),
                unsigned.ipnUrl(),
                unsigned.requestType(),
                unsigned.extraData(),
                unsigned.autoCapture(),
                unsigned.lang(),
                signature
        );

        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(payment)
                .transactionId(requestId)
                .status("PENDING")
                .partnerCode(properties.getPartnerCode())
                .gatewayOrderId(orderId)
                .gatewayRequestId(requestId)
                .amountVnd(amount)
                .requestPayload(toJson(Map.of(
                        "paymentId", payment.getId(),
                        "orderId", orderId,
                        "requestId", requestId,
                        "amount", amount,
                        "requestType", properties.getRequestType()
                )))
                .gatewayResponse("{}")
                .build();
        transactionRepository.saveAndFlush(transaction);

        long startTime = System.currentTimeMillis();
        try {
            MomoCreatePaymentResponse response = client.createPayment(request);
            long latencyMs = System.currentTimeMillis() - startTime;
            if (response == null) {
                log.error("MoMo payment creation returned null response for paymentId={} orderId={} latency={}ms",
                        payment.getId(), orderId, latencyMs);
                return markFailure(transaction, "MoMo returned an empty response");
            }

            transaction.setResultCode(response.resultCode());
            transaction.setResponseMessage(sanitize(response.message()));
            transaction.setPayUrl(response.payUrl());
            transaction.setGatewayResponse(toJson(sanitizedResponse(response)));

            boolean validPayUrl = isExpectedPayUrl(response.payUrl());
            boolean accepted = Integer.valueOf(0).equals(response.resultCode())
                    && properties.getPartnerCode().equals(response.partnerCode())
                    && orderId.equals(response.orderId())
                    && requestId.equals(response.requestId())
                    && Long.valueOf(amount).equals(response.amount())
                    && response.payUrl() != null
                    && validPayUrl;

            transaction.setStatus(accepted ? "PROCESSING" : "FAILED");
            transactionRepository.save(transaction);

            log.info("MoMo payment creation result for paymentId={} orderId={} accepted={} resultCode={} validPayUrl={} latency={}ms",
                    payment.getId(), orderId, accepted, response.resultCode(), validPayUrl, latencyMs);

            return GatewayResponse.builder()
                    .success(accepted)
                    .gatewayTransactionId(requestId)
                    .gatewayStatus(accepted ? "PROCESSING" : "FAILED")
                    .errorMessage(accepted ? null : userSafeMessage(response))
                    .rawResponse(sanitizedResponse(response))
                    .build();
        } catch (RuntimeException exception) {
            long latencyMs = System.currentTimeMillis() - startTime;
            log.error("MoMo payment creation failed for paymentId={} orderId={} latency={}ms: {}",
                    payment.getId(), orderId, latencyMs, exception.getMessage());
            return markFailure(transaction, "MoMo payment creation is temporarily unavailable");
        }
    }

    @Override
    public GatewayResponse processRefund(Payment payment, BigDecimal amount, String reason) {
        throw new UnsupportedOperationException("MoMo refunds are not implemented by this checkout flow");
    }

    private long resolveAmount(Payment payment) {
        if (!"VND".equalsIgnoreCase(payment.getCurrency())) {
            throw new IllegalArgumentException("MoMo payments require VND");
        }
        final long amount;
        try {
            amount = payment.getAmount().longValueExact();
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("MoMo amount must be a whole VND value", exception);
        }
        if (amount < MIN_AMOUNT_VND || amount > MAX_AMOUNT_VND) {
            throw new IllegalArgumentException("MoMo amount must be between 1,000 and 50,000,000 VND");
        }
        return amount;
    }

    private GatewayResponse markFailure(PaymentTransaction transaction, String message) {
        transaction.setStatus("FAILED");
        transaction.setResponseMessage(message);
        transaction.setGatewayResponse(toJson(Map.of("message", message)));
        transactionRepository.save(transaction);
        return GatewayResponse.builder()
                .success(false)
                .gatewayTransactionId(transaction.getGatewayRequestId())
                .gatewayStatus("FAILED")
                .errorMessage(message)
                .rawResponse(Map.of("message", message))
                .build();
    }

    private Map<String, Object> sanitizedResponse(MomoCreatePaymentResponse response) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("partnerCode", response.partnerCode());
        result.put("orderId", response.orderId());
        result.put("requestId", response.requestId());
        result.put("amount", response.amount());
        result.put("responseTime", response.responseTime());
        result.put("message", sanitize(response.message()));
        result.put("resultCode", response.resultCode());
        result.put("payUrl", response.payUrl());
        result.put("deeplink", response.deeplink());
        result.put("qrCodeUrl", response.qrCodeUrl());
        return result;
    }

    private String userSafeMessage(MomoCreatePaymentResponse response) {
        return response.message() == null || response.message().isBlank()
                ? "MoMo rejected the payment request"
                : sanitize(response.message());
    }

    private boolean isExpectedPayUrl(String payUrl) {
        if (payUrl == null || payUrl.isBlank()) {
            return false;
        }
        try {
            URI payUri = URI.create(payUrl);
            if (!"https".equalsIgnoreCase(payUri.getScheme()) || payUri.getHost() == null) {
                return false;
            }
            String payHost = payUri.getHost().toLowerCase();
            String endpointHost = extractHost(properties.getEndpoint());

            return payHost.equals("test-payment.momo.vn")
                    || payHost.equals("payment.momo.vn")
                    || (endpointHost != null && !endpointHost.isBlank() && payHost.equalsIgnoreCase(endpointHost));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private String extractHost(String uriString) {
        if (uriString == null || uriString.isBlank()) {
            return "unspecified";
        }
        try {
            URI uri = URI.create(uriString);
            return uri.getHost() != null ? uri.getHost() : "invalid";
        } catch (Exception e) {
            return "invalid";
        }
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("[\\r\\n\\t]", " ").strip();
    }

    private String compactId(String prefix) {
        return prefix + "_" + compactUuid(32);
    }

    private String compactUuid(int length) {
        return UUID.randomUUID().toString().replace("-", "").substring(0, length);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }
}
