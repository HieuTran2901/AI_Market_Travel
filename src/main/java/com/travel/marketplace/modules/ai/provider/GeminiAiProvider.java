package com.travel.marketplace.modules.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.ai.config.AiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Gemini AI provider.
 * Uses Spring's RestClient for zero-dependency HTTP calls.
 *
 * Activated when: ai.provider=gemini (and ai.gemini.apiKey is set in application.yml)
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "ai.provider", havingValue = "gemini")
@RequiredArgsConstructor
public class GeminiAiProvider implements AiProvider {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    @Override
    public AiResponse complete(AiRequest request) {
        AiProperties.Gemini cfg = aiProperties.getGemini();

        RestClient client = RestClient.builder()
                .baseUrl(cfg.getBaseUrl())
                .build();

        // Build Gemini request body
        List<Map<String, Object>> contents = new ArrayList<>();

        // Add system context as a user message if present
        if (request.getSystemContext() != null && !request.getSystemContext().isBlank()) {
            contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", request.getSystemContext()))
            ));
            contents.add(Map.of(
                "role", "model",
                "parts", List.of(Map.of("text", "Understood. I will follow these instructions."))
            ));
        }

        // Add conversation history
        if (request.getConversationHistory() != null) {
            for (AiRequest.ConversationMessage msg : request.getConversationHistory()) {
                contents.add(Map.of(
                    "role", "user".equals(msg.getRole()) ? "user" : "model",
                    "parts", List.of(Map.of("text", msg.getContent()))
                ));
            }
        }

        // Add the current prompt
        contents.add(Map.of(
            "role", "user",
            "parts", List.of(Map.of("text", request.getPrompt()))
        ));

        Map<String, Object> body = new HashMap<>();
        body.put("contents", contents);
        body.put("generationConfig", Map.of(
            "maxOutputTokens", request.getMaxTokens(),
            "temperature", request.getTemperature()
        ));

        try {
            String url = "/models/" + cfg.getModel() + ":generateContent?key=" + cfg.getApiKey();
            String rawJson = client.post()
                    .uri(url)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(rawJson);
            String text = root.at("/candidates/0/content/parts/0/text").asText();
            String finishReason = root.at("/candidates/0/finishReason").asText("stop");
            int promptTokens = root.at("/usageMetadata/promptTokenCount").asInt(0);
            int completionTokens = root.at("/usageMetadata/candidatesTokenCount").asInt(0);

            return AiResponse.builder()
                    .text(text)
                    .model(cfg.getModel())
                    .finishReason(finishReason)
                    .mocked(false)
                    .usage(AiResponse.TokenUsage.builder()
                            .promptTokens(promptTokens)
                            .completionTokens(completionTokens)
                            .totalTokens(promptTokens + completionTokens)
                            .build())
                    .build();

        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            return AiResponse.builder()
                    .text("I'm currently unable to process your request. Please try again later.")
                    .model(cfg.getModel())
                    .finishReason("error")
                    .mocked(false)
                    .build();
        }
    }

    @Override
    public String providerName() {
        return "gemini";
    }
}
