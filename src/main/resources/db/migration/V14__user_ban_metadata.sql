ALTER TABLE users
    ADD COLUMN banned_at DATETIME NULL,
    ADD COLUMN banned_by BIGINT NULL,
    ADD COLUMN ban_reason_code VARCHAR(80) NULL,
    ADD COLUMN ban_reason VARCHAR(1000) NULL,
    ADD COLUMN previous_status VARCHAR(30) NULL,
    ADD INDEX idx_users_banned_at (banned_at),
    ADD CONSTRAINT fk_users_banned_by
        FOREIGN KEY (banned_by) REFERENCES users (id)
        ON DELETE SET NULL;
