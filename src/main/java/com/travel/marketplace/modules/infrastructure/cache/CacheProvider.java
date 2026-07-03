package com.travel.marketplace.modules.infrastructure.cache;

import java.util.Optional;

public interface CacheProvider {
    void put(String cacheName, String key, Object value);
    <T> Optional<T> get(String cacheName, String key, Class<T> type);
    void evict(String cacheName, String key);
    void clear(String cacheName);
}
