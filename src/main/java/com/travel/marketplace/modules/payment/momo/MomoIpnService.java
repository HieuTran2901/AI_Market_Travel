package com.travel.marketplace.modules.payment.momo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.travel.marketplace.modules.payment.service.PaymentService;
import com.travel.marketplace.modules.payment.service.AiCoinPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "payment.momo", name = "enabled", havingValue = "true")
public class MomoIpnService {

    private final MomoProperties properties;
    private final MomoSigner signer;
    private final MomoResultCodeMapper resultCodeMapper;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentService paymentService;
    private final AiCoinPaymentService aiCoinPaymentService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void process(MomoIpnRequest request) {
        validateRequiredFields(request);
        String expectedSignature = signer.signIpn(
                request,
                properties.getAccessKey(),
                properties.getSecretKey()
        );
        if (!signer.verify(expectedSignature, request.signature())) {
            throw callbackError("Invalid MoMo IPN signature");
        }

        PaymentTransaction transaction = transactionRepository.findByGatewayOrderId(request.orderId())
                .orElseThrow(() -> callbackError("Unknown MoMo order"));
        verifyStoredValues(transaction, request);

        Payment payment = transaction.getPayment();
        PaymentStatus targetStatus = resultCodeMapper.map(request.resultCode());
        if (isTerminal(payment.getStatus())) {
            log.info(
                    "Ignoring duplicate or regressive MoMo IPN for payment {} with result code {}",
                    payment.getId(),
                    request.resultCode()
            );
            return;
        }

        transaction.setResultCode(request.resultCode());
        transaction.setMomoTransId(request.transId());
        transaction.setPayType(sanitize(request.payType()));
        transaction.setResponseMessage(sanitize(request.message()));
        transaction.setStatus(targetStatus.name());
        transaction.setGatewayResponse(toJson(sanitizedPayload(request)));
        if (targetStatus == PaymentStatus.SUCCESS) {
            transaction.setPaidAt(Instant.now());
        }
        transactionRepository.save(transaction);

        if (payment.getPurpose() == PaymentPurpose.AI_COIN_PURCHASE) {
            aiCoinPaymentService.handlePaymentStatusUpdate(payment.getId(), targetStatus);
        } else {
            paymentService.applyVerifiedGatewayStatus(payment.getId(), targetStatus);
        }

        log.info(
                "Processed verified MoMo IPN for payment {} with result code {}",
                payment.getId(),
                request.resultCode()
        );
    }

    private void verifyStoredValues(PaymentTransaction transaction, MomoIpnRequest request) {
        Payment payment = transaction.getPayment();
        if (payment.getPaymentMethod() != PaymentMethod.MOMO
                || !Objects.equals(transaction.getPartnerCode(), request.partnerCode())
                || !Objects.equals(transaction.getGatewayOrderId(), request.orderId())
                || !Objects.equals(transaction.getGatewayRequestId(), request.requestId())
                || !Objects.equals(transaction.getAmountVnd(), request.amount())) {
            throw callbackError("MoMo IPN does not match the stored payment");
        }
    }

    private void validateRequiredFields(MomoIpnRequest request) {
        if (request == null
                || isBlank(request.partnerCode())
                || isBlank(request.orderId())
                || isBlank(request.requestId())
                || request.amount() == null
                || request.resultCode() == null
                || request.responseTime() == null
                || request.transId() == null
                || isBlank(request.signature())) {
            throw callbackError("Incomplete MoMo IPN payload");
        }
    }

    private Map<String, Object> sanitizedPayload(MomoIpnRequest request) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("partnerCode", request.partnerCode());
        result.put("orderId", request.orderId());
        result.put("requestId", request.requestId());
        result.put("amount", request.amount());
        result.put("orderInfo", sanitize(request.orderInfo()));
        result.put("orderType", sanitize(request.orderType()));
        result.put("transId", request.transId());
        result.put("resultCode", request.resultCode());
        result.put("message", sanitize(request.message()));
        result.put("payType", sanitize(request.payType()));
        result.put("responseTime", request.responseTime());
        result.put("extraData", request.extraData() == null ? "" : request.extraData());
        return result;
    }

    private BusinessException callbackError(String message) {
        return new BusinessException(ErrorCode.BAD_REQUEST, message, HttpStatus.BAD_REQUEST);
    }

    private boolean isTerminal(PaymentStatus status) {
        return status == PaymentStatus.SUCCESS
                || status == PaymentStatus.FAILED
                || status == PaymentStatus.CANCELLED
                || status == PaymentStatus.REFUNDED
                || status == PaymentStatus.EXPIRED;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String sanitize(String value) {
        return value == null ? null : value.replaceAll("[\\r\\n\\t]", " ").strip();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }
}
