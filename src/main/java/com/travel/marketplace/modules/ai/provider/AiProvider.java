package com.travel.marketplace.modules.ai.provider;

/**
 * Core abstraction for all AI LLM providers.
 *
 * Implementations: MockAiProvider, GeminiAiProvider, OpenAiProvider, AnthropicAiProvider
 *
 * The AI module calls ONLY this interface. Switching providers requires:
 * 1. Implement this interface.
 * 2. Register the bean with the correct @ConditionalOnProperty.
 * 3. Update application.yml: ai.provider = <new-provider>.
 * No business logic changes needed.
 */
public interface AiProvider {

    /**
     * Sends a single-shot prompt and returns the complete response.
     */
    AiResponse complete(AiRequest request);

    /**
     * Returns the name identifier of this provider.
     * Used for logging and observability.
     */
    String providerName();
}
