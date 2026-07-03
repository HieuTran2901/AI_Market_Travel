-- =============================================================
-- V5: Refund & Settlement Refinements (Phase 4)
-- Author: AI Travel Marketplace Team
-- Database: MySQL 8
-- =============================================================

-- ---------------------------------------------------------------
-- 1. REFUNDS — Add audit information
-- ---------------------------------------------------------------
ALTER TABLE refunds
    ADD COLUMN requested_by BIGINT NULL COMMENT 'User ID who requested the refund',
    ADD COLUMN processed_by BIGINT NULL COMMENT 'Admin/System User ID who processed the refund',
    ADD COLUMN processed_at DATETIME NULL COMMENT 'When the refund was processed';

-- We could optionally add FK constraints for requested_by and processed_by, but 
-- to keep it simple and decoupled (and allow SYSTEM process), we leave them as plain columns for now.
-- Or we add them:
ALTER TABLE refunds
    ADD CONSTRAINT fk_refunds_requested_by FOREIGN KEY (requested_by) REFERENCES users (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_refunds_processed_by FOREIGN KEY (processed_by) REFERENCES users (id) ON DELETE SET NULL;


-- ---------------------------------------------------------------
-- 2. SETTLEMENTS — Add financial breakdown
-- ---------------------------------------------------------------
ALTER TABLE settlements
    ADD COLUMN gross_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount before fees',
    ADD COLUMN platform_fee DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Platform commission/fee',
    ADD COLUMN provider_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Amount meant for provider (usually same as amount)',
    ADD COLUMN tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Tax collected/deducted';

-- Update the existing status comment (though ENUMs in JPA drive the logic, it's good for DB schema documentation)
ALTER TABLE settlements MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING|PROCESSING|COMPLETED|FAILED|CANCELLED';
