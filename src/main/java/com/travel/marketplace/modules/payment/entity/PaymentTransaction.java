package com.travel.marketplace.modules.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "payment_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "request_payload", columnDefinition = "json")
    private String requestPayload;

    @Column(name = "gateway_response", columnDefinition = "json")
    private String gatewayResponse;

    @Column(name = "partner_code", length = 30)
    private String partnerCode;

    @Column(name = "gateway_order_id", length = 100, unique = true)
    private String gatewayOrderId;

    @Column(name = "gateway_request_id", length = 100, unique = true)
    private String gatewayRequestId;

    @Column(name = "amount_vnd")
    private Long amountVnd;

    @Column(name = "result_code")
    private Integer resultCode;

    @Column(name = "momo_trans_id", unique = true)
    private Long momoTransId;

    @Column(name = "pay_type", length = 50)
    private String payType;

    @Column(name = "response_message", length = 500)
    private String responseMessage;

    @Column(name = "pay_url", length = 2048)
    private String payUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "paid_at")
    private Instant paidAt;
}
