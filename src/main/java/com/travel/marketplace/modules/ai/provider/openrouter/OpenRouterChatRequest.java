package com.travel.marketplace.modules.ai.provider.openrouter;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OpenRouterChatRequest(
        String model,
        List<Message> messages,
        Double temperature,
        @JsonProperty("max_tokens") Integer maxTokens,
        Boolean stream,
        @JsonProperty("response_format") ResponseFormat responseFormat,
        Reasoning reasoning
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Message(String role, String content) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ResponseFormat(
            String type,
            @JsonProperty("json_schema") JsonSchema jsonSchema
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record JsonSchema(
            String name,
            Boolean strict,
            Map<String, Object> schema
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Reasoning(
            String effort,
            Boolean exclude
    ) {
    }
}
