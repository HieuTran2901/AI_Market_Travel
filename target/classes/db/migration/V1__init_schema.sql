-- =============================================================
-- V1: Core Identity Schema (Phase 1)
-- Author: AI Travel Marketplace Team
-- Database: MySQL 8 — No PostgreSQL syntax
-- =============================================================

-- 1. roles table
CREATE TABLE roles (
    id      BIGINT      NOT NULL AUTO_INCREMENT,
    name    VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_name (name)
);

-- 2. users table
CREATE TABLE users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    email           VARCHAR(100)    NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(100)    NOT NULL,
    phone_number    VARCHAR(20)     NULL,
    avatar_url      VARCHAR(255)    NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
);

-- 3. user_roles join table
CREATE TABLE user_roles (
    user_id     BIGINT  NOT NULL,
    role_id     BIGINT  NOT NULL,
    PRIMARY KEY (user_id, role_id),
    INDEX idx_user_roles_user_id (user_id),
    INDEX idx_user_roles_role_id (role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- 4. provider_profiles table (Phase 1 basic version; Phase 2 ALTERs this table)
CREATE TABLE provider_profiles (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    business_name       VARCHAR(150)    NOT NULL,
    business_type       VARCHAR(20)     NOT NULL,
    address             TEXT            NOT NULL,
    tax_code            VARCHAR(50)     NULL,
    bank_name           VARCHAR(100)    NULL,
    bank_account_number VARCHAR(50)     NULL,
    bank_account_name   VARCHAR(100)    NULL,
    verification_status VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_provider_user_id (user_id),
    INDEX idx_provider_status (verification_status),
    CONSTRAINT fk_provider_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 5. Seed default roles
INSERT INTO roles (name) VALUES
    ('ROLE_ADMIN'),
    ('ROLE_CUSTOMER'),
    ('ROLE_PROVIDER_HOTEL'),
    ('ROLE_PROVIDER_TOUR'),
    ('ROLE_PROVIDER_RESTAURANT'),
    ('ROLE_PROVIDER_VEHICLE'),
    ('ROLE_PROVIDER_EXPERIENCE');
