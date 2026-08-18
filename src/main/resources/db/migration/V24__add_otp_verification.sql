-- =============================================================
-- V24: Add OTP Verification Table and User Email Verification
-- Author: AI Travel Marketplace Team
-- Database: MySQL 8 — No PostgreSQL syntax
-- =============================================================

-- 1. Add email verification columns to users table
ALTER TABLE users
    ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active,
    ADD COLUMN email_verified_at DATETIME NULL AFTER email_verified;

-- 2. Mark existing users as email_verified = 1 so they are not locked out
UPDATE users SET email_verified = 1 WHERE email_verified = 0;

-- 3. Create otp_verifications table for persistent OTP tracking
CREATE TABLE otp_verifications (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    email           VARCHAR(100)    NOT NULL,
    otp_hash        VARCHAR(255)    NOT NULL,
    purpose         VARCHAR(30)     NOT NULL,
    expires_at      DATETIME        NOT NULL,
    verified_at     DATETIME        NULL,
    consumed_at     DATETIME        NULL,
    attempt_count   INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 4. Indexes for OTP lookup and expiration cleanup queries
CREATE INDEX idx_otp_verifications_email_purpose ON otp_verifications (email, purpose);
CREATE INDEX idx_otp_verifications_expires_at ON otp_verifications (expires_at);
