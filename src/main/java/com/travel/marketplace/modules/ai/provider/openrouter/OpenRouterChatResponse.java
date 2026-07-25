package com.travel.marketplace.modules.ai.provider.openrouter;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record OpenRouterChatResponse(
        String id,
        String model,
        List<Choice> choices,
        Usage usage
) {
    public record Choice(
            int index,
            Message message,
            @JsonProperty("finish_reason") String finishReason
    ) {
    }

    public record Message(
            String role,
            String content,
            String reasoning,
            @JsonProperty("reasoning_content") String reasoningContent
    ) {
    }

    public record Usage(
            @JsonProperty("prompt_tokens") Integer promptTokens,
            @JsonProperty("completion_tokens") Integer completionTokens,
            @JsonProperty("total_tokens") Integer totalTokens
    ) {
    }
}
