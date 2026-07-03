package com.travel.marketplace.modules.ai.provider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Provider-agnostic AI response. All provider implementations map their vendor responses
 * to this structure before returning to business logic.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResponse {

    /** The generated text content */
    private String text;

    /** The model that generated this response (e.g. gemini-1.5-flash) */
    private String model;

    /** Why the generation stopped: stop | length | error */
    private String finishReason;

    /** Token usage stats for cost tracking */
    private TokenUsage usage;

    /** Whether this response came from a real provider or a mock */
    private boolean mocked;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenUsage {
        private int promptTokens;
        private int completionTokens;
        private int totalTokens;
    }
}
