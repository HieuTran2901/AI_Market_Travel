-- =============================================================
-- V4: Payment & Transaction Engine (Phase 4)
-- Author: AI Travel Marketplace Team
-- Database: MySQL 8
-- =============================================================

-- ---------------------------------------------------------------
-- 1. PAYMENTS — Core payment record linked to an Order
--    Completely independent from Booking.
-- ---------------------------------------------------------------
CREATE TABLE payments (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    order_id            BIGINT          NOT NULL COMMENT 'FK to orders table',
    amount              DECIMAL(14,2)   NOT NULL,
    currency            VARCHAR(10)     NOT NULL DEFAULT 'USD',
    status              VARCHAR(30)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING|PROCESSING|SUCCESS|FAILED|CANCELLED|REFUNDED|EXPIRED',
    payment_method      VARCHAR(50)     NOT NULL COMMENT 'MOCK|COD|VNPAY|MOMO|ZALOPAY|STRIPE|PAYPAL',
    idempotency_key     VARCHAR(100)    NULL COMMENT 'To prevent duplicate payment creation',
    expires_at          DATETIME        NULL COMMENT 'Payment timeout scenario',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_payments_order (order_id),
    UNIQUE KEY uk_payments_idempotency (idempotency_key),
    INDEX idx_payments_status (status),
    INDEX idx_payments_deleted (deleted_at),
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 2. PAYMENT_TRANSACTIONS — Granular log of interactions with gateway
-- ---------------------------------------------------------------
CREATE TABLE payment_transactions (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    payment_id          BIGINT          NOT NULL,
    transaction_id      VARCHAR(100)    NULL COMMENT 'Gateway specific transaction ID',
    status              VARCHAR(30)     NOT NULL COMMENT 'Gateway specific or mapped status',
    request_payload     JSON            NULL COMMENT 'Gateway request payload for troubleshooting',
    gateway_response    JSON            NULL COMMENT 'Gateway response payload for troubleshooting',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_pay_txn_payment (payment_id),
    CONSTRAINT fk_pay_txn_payment
        FOREIGN KEY (payment_id) REFERENCES payments (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 3. REFUNDS — Records of refunded amounts linked to a Payment
-- ---------------------------------------------------------------
CREATE TABLE refunds (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    payment_id          BIGINT          NOT NULL,
    amount              DECIMAL(14,2)   NOT NULL,
    reason              VARCHAR(100)    NOT NULL COMMENT 'Reason for refund',
    status              VARCHAR(30)     NOT NULL DEFAULT 'PENDING' COMMENT 'Refund status',
    refund_method       VARCHAR(50)     NOT NULL COMMENT 'Method used for refund',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_refunds_payment (payment_id),
    CONSTRAINT fk_refunds_payment
        FOREIGN KEY (payment_id) REFERENCES payments (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 4. SETTLEMENTS — Platform settlements to providers
-- ---------------------------------------------------------------
CREATE TABLE settlements (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    provider_id         BIGINT          NOT NULL,
    amount              DECIMAL(14,2)   NOT NULL,
    currency            VARCHAR(10)     NOT NULL DEFAULT 'USD',
    status              VARCHAR(30)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING|PROCESSING|PAID|FAILED',
    period_start        DATETIME        NOT NULL COMMENT 'Start of settlement period',
    period_end          DATETIME        NOT NULL COMMENT 'End of settlement period',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_settlements_provider (provider_id),
    INDEX idx_settlements_status (status),
    CONSTRAINT fk_settlements_provider
        FOREIGN KEY (provider_id) REFERENCES users (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 5. PAYOUT_REQUESTS — Provider requests for payout of their balance
-- ---------------------------------------------------------------
CREATE TABLE payout_requests (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    provider_id         BIGINT          NOT NULL,
    amount              DECIMAL(14,2)   NOT NULL,
    currency            VARCHAR(10)     NOT NULL DEFAULT 'USD',
    status              VARCHAR(30)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING|PROCESSING|PAID|FAILED|REJECTED',
    notes               TEXT            NULL,
    requested_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at        DATETIME        NULL,
    deleted_at          DATETIME        NULL,

    PRIMARY KEY (id),
    INDEX idx_payout_req_provider (provider_id),
    INDEX idx_payout_req_status (status),
    INDEX idx_payout_req_deleted (deleted_at),
    CONSTRAINT fk_payout_req_provider
        FOREIGN KEY (provider_id) REFERENCES users (id)
        ON DELETE CASCADE
);
