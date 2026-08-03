-- Add login streak and last login date to users table
ALTER TABLE users ADD COLUMN login_streak_days INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login_date TIMESTAMP;
