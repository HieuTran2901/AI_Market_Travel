package com.travel.marketplace.modules.infrastructure.cache;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "platform.cache", havingValue = "local", matchIfMissing = true)
public class LocalCacheProvider implements CacheProvider {

    private final Map<String, Map<String, Object>> store = new ConcurrentHashMap<>();

    @Override
    public void put(String cacheName, String key, Object value) {
        store.computeIfAbsent(cacheName, k -> new ConcurrentHashMap<>()).put(key, value);
    }

    @Override
    public <T> Optional<T> get(String cacheName, String key, Class<T> type) {
        Map<String, Object> cache = store.get(cacheName);
        if (cache == null) return Optional.empty();
        Object value = cache.get(key);
        if (type.isInstance(value)) {
            return Optional.of(type.cast(value));
        }
        return Optional.empty();
    }

    @Override
    public void evict(String cacheName, String key) {
        Map<String, Object> cache = store.get(cacheName);
        if (cache != null) {
            cache.remove(key);
        }
    }

    @Override
    public void clear(String cacheName) {
        store.remove(cacheName);
    }
}
