-- 1. Add ai_coin_balance to users table
ALTER TABLE users ADD COLUMN ai_coin_balance INT NOT NULL DEFAULT 0;

-- 2. Create ai_coin_purchases table
CREATE TABLE ai_coin_purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    package_code VARCHAR(50) NOT NULL,
    base_coins INT NOT NULL,
    bonus_coins INT NOT NULL,
    total_coins INT NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(30) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    merchant_order_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    CONSTRAINT fk_ai_coin_purchases_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_ai_coin_purchase_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_ai_coin_purchases_status ON ai_coin_purchases(status);
CREATE INDEX idx_ai_coin_purchases_merchant_order_id ON ai_coin_purchases(merchant_order_id);

-- 3. Modify payments table to allow AI Coin payments
-- First, add new columns
ALTER TABLE payments ADD COLUMN purpose VARCHAR(30) DEFAULT 'BOOKING';
ALTER TABLE payments ADD COLUMN reference_id BIGINT;

-- Backfill purpose for existing bookings
UPDATE payments SET purpose = 'BOOKING' WHERE purpose IS NULL;
ALTER TABLE payments MODIFY COLUMN purpose VARCHAR(30) NOT NULL;

-- Make order_id nullable (MySQL syntax)
ALTER TABLE payments MODIFY COLUMN order_id BIGINT NULL;
