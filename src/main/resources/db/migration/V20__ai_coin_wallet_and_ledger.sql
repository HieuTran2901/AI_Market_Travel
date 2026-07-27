-- V20: Persistent AI Coins wallet and immutable ledger

CREATE TABLE user_ai_coin_wallets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0,
    lifetime_earned BIGINT NOT NULL DEFAULT 0,
    lifetime_spent BIGINT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ai_coin_wallet_user (user_id),
    CONSTRAINT fk_ai_coin_wallet_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_ai_coin_wallet_balance_nonnegative CHECK (balance >= 0),
    CONSTRAINT ck_ai_coin_wallet_lifetime_earned_nonnegative CHECK (lifetime_earned >= 0),
    CONSTRAINT ck_ai_coin_wallet_lifetime_spent_nonnegative CHECK (lifetime_spent >= 0)
);

CREATE TABLE ai_coin_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    wallet_id BIGINT NOT NULL,
    type VARCHAR(40) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    amount BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    source_type VARCHAR(60) NOT NULL,
    source_id BIGINT NULL,
    payment_id BIGINT NULL,
    purchase_id BIGINT NULL,
    reference VARCHAR(120) NULL,
    description VARCHAR(255) NULL,
    idempotency_key VARCHAR(180) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ai_coin_transaction_idempotency (idempotency_key),
    INDEX idx_ai_coin_transactions_user_created (user_id, created_at),
    INDEX idx_ai_coin_transactions_payment (payment_id),
    INDEX idx_ai_coin_transactions_purchase (purchase_id),
    INDEX idx_ai_coin_transactions_source (source_type, source_id),
    CONSTRAINT fk_ai_coin_transaction_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_coin_transaction_wallet
        FOREIGN KEY (wallet_id) REFERENCES user_ai_coin_wallets (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_coin_transaction_payment
        FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE SET NULL,
    CONSTRAINT fk_ai_coin_transaction_purchase
        FOREIGN KEY (purchase_id) REFERENCES ai_coin_purchases (id) ON DELETE SET NULL,
    CONSTRAINT ck_ai_coin_transaction_amount_positive CHECK (amount > 0),
    CONSTRAINT ck_ai_coin_transaction_balance_before_nonnegative CHECK (balance_before >= 0),
    CONSTRAINT ck_ai_coin_transaction_balance_after_nonnegative CHECK (balance_after >= 0)
);

INSERT INTO user_ai_coin_wallets (user_id, balance, lifetime_earned, lifetime_spent, version)
SELECT u.id, COALESCE(u.ai_coin_balance, 0), COALESCE(u.ai_coin_balance, 0), 0, 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1
    FROM user_ai_coin_wallets wallet
    WHERE wallet.user_id = u.id
);
