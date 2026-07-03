package com.travel.marketplace.modules.ai.provider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Provider-agnostic AI request object.
 * The AI module constructs these; provider implementations translate them to vendor-specific formats.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRequest {

    /** The user-facing prompt or question */
    private String prompt;

    /** Optional system context / instructions prepended by the provider */
    private String systemContext;

    /** Conversation history for multi-turn assistant interactions */
    private List<ConversationMessage> conversationHistory;

    /** Max tokens to generate (provider will cap to its limit if exceeded) */
    @Builder.Default
    private int maxTokens = 1024;

    /** Temperature controls creativity: 0.0 = deterministic, 1.0 = very creative */
    @Builder.Default
    private double temperature = 0.7;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationMessage {
        /** "user" or "assistant" */
        private String role;
        private String content;
    }
}
