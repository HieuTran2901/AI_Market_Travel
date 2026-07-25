package com.travel.marketplace.modules.payment.momo;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

@Component
public class MomoSigner {

    public String signCreate(MomoCreatePaymentRequest request, String accessKey, String secretKey) {
        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + request.amount()
                + "&extraData=" + request.extraData()
                + "&ipnUrl=" + request.ipnUrl()
                + "&orderId=" + request.orderId()
                + "&orderInfo=" + request.orderInfo()
                + "&partnerCode=" + request.partnerCode()
                + "&redirectUrl=" + request.redirectUrl()
                + "&requestId=" + request.requestId()
                + "&requestType=" + request.requestType();
        return hmacSha256(rawSignature, secretKey);
    }

    public String signIpn(MomoIpnRequest request, String accessKey, String secretKey) {
        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + request.amount()
                + "&extraData=" + safe(request.extraData())
                + "&message=" + safe(request.message())
                + "&orderId=" + request.orderId()
                + "&orderInfo=" + safe(request.orderInfo())
                + "&orderType=" + safe(request.orderType())
                + "&partnerCode=" + request.partnerCode()
                + "&payType=" + safe(request.payType())
                + "&requestId=" + request.requestId()
                + "&responseTime=" + request.responseTime()
                + "&resultCode=" + request.resultCode()
                + "&transId=" + request.transId();
        return hmacSha256(rawSignature, secretKey);
    }

    public boolean verify(String expected, String supplied) {
        if (expected == null || supplied == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.US_ASCII),
                supplied.toLowerCase().getBytes(StandardCharsets.US_ASCII)
        );
    }

    private String hmacSha256(String value, String secretKey) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to initialize MoMo request signing", exception);
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
