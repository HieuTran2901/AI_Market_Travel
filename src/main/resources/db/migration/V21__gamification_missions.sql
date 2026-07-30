CREATE TABLE user_missions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    mission_id VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    reward_coins INT NOT NULL DEFAULT 0,
    claimed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_mission (user_id, mission_id),
    CONSTRAINT fk_user_missions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_missions_user_id ON user_missions(user_id);
