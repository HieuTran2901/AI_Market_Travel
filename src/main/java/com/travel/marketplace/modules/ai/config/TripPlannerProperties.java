package com.travel.marketplace.modules.ai.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai.trip-planner")
public class TripPlannerProperties {

    private String structuredModel = "google/gemini-2.0-flash-001";
    private String fallbackStructuredModel = "openai/gpt-4o-mini";
    private boolean structuredJsonSchemaEnabled = true;
    private String reasoningEffort = "low";
    private boolean excludeReasoning = true;
    private int maxOutputTokensBase = 1600;
    private int maxOutputTokensPerDay = 750;
    private int maxOutputTokensCap = 6000;
    private int truncationRetryMultiplier = 2;
    private int maxActivitiesPerDay = 4;
    private int maxDescriptionWords = 20;
    private int maxListingContextItems = 16;
    private boolean truncationRetryEnabled = true;

    @PostConstruct
    public void validate() {
        if (structuredModel == null || structuredModel.isBlank()) {
            throw new IllegalStateException("ai.trip-planner.structured-model must be configured");
        }
        if (fallbackStructuredModel == null || fallbackStructuredModel.isBlank()) {
            throw new IllegalStateException("ai.trip-planner.fallback-structured-model must be configured");
        }
        if (maxOutputTokensBase < 256) {
            throw new IllegalStateException("ai.trip-planner.max-output-tokens-base must be at least 256");
        }
        if (maxOutputTokensPerDay < 128) {
            throw new IllegalStateException("ai.trip-planner.max-output-tokens-per-day must be at least 128");
        }
        if (maxOutputTokensCap < maxOutputTokensBase) {
            throw new IllegalStateException("ai.trip-planner.max-output-tokens-cap must be >= base");
        }
        if (truncationRetryMultiplier < 1) {
            throw new IllegalStateException("ai.trip-planner.truncation-retry-multiplier must be >= 1");
        }
        if (maxActivitiesPerDay < 1) {
            throw new IllegalStateException("ai.trip-planner.max-activities-per-day must be >= 1");
        }
        if (maxDescriptionWords < 8) {
            throw new IllegalStateException("ai.trip-planner.max-description-words must be >= 8");
        }
        if (maxListingContextItems < 0) {
            throw new IllegalStateException("ai.trip-planner.max-listing-context-items must be >= 0");
        }
    }

    public int calculateMaxOutputTokens(Integer durationDays) {
        int days = durationDays != null && durationDays > 0 ? durationDays : 3;
        long requested = (long) maxOutputTokensBase + (long) days * maxOutputTokensPerDay;
        return (int) Math.min(maxOutputTokensCap, requested);
    }

    public int calculateRetryMaxOutputTokens(Integer durationDays) {
        long requested = (long) calculateMaxOutputTokens(durationDays) * truncationRetryMultiplier;
        return (int) Math.min(maxOutputTokensCap, requested);
    }
}
