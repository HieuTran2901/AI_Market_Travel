package com.travel.marketplace.modules.infrastructure.ratelimit;

public interface RateLimiter {
    boolean tryConsume(String key);
}
