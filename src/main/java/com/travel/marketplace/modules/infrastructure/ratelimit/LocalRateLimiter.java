package com.travel.marketplace.modules.infrastructure.ratelimit;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class LocalRateLimiter implements RateLimiter {
    private static final int MAX_REQUESTS_PER_MINUTE = 100;
    private final Map<String, RequestData> clientRequests = new ConcurrentHashMap<>();

    @Override
    public boolean tryConsume(String key) {
        long now = System.currentTimeMillis();

        clientRequests.compute(key, (ip, data) -> {
            if (data == null || (now - data.timestamp) > 60000) {
                return new RequestData(now, new AtomicInteger(1));
            }
            data.count.incrementAndGet();
            return data;
        });

        RequestData data = clientRequests.get(key);
        return data.count.get() <= MAX_REQUESTS_PER_MINUTE;
    }

    private record RequestData(long timestamp, AtomicInteger count) {}
}
