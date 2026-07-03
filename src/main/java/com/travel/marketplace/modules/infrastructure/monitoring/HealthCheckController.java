package com.travel.marketplace.modules.infrastructure.monitoring;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Basic health check endpoints for container orchestrators (e.g. Kubernetes).
 * Replaces Spring Boot Actuator to keep dependencies light for this phase.
 */
@RestController
@RequestMapping("/health")
public class HealthCheckController {

    @GetMapping("/liveness")
    public ResponseEntity<Map<String, String>> liveness() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @GetMapping("/readiness")
    public ResponseEntity<Map<String, String>> readiness() {
        // In a real app, check DB connections, cache connections, etc.
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
