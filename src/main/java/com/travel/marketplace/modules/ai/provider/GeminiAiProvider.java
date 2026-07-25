package com.travel.marketplace.modules.ai.provider;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.ai.config.GeminiProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@ConditionalOnProperty(prefix = "ai", name = "provider", havingValue = "gemini")
public class GeminiAiProvider implements AiProvider {

    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient client;

    public GeminiAiProvider(
            GeminiProperties properties,
            ObjectMapper objectMapper,
            RestClient.Builder restClientBuilder
    ) {
        properties.validate();
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.client = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .requestFactory(createRequestFactory(properties))
                .build();
        log.info(
                "Gemini configuration keyPresent={} keyLength={} baseUrl={} apiVersion={} model={}",
                !properties.getApiKey().isBlank(),
                properties.getApiKey().length(),
                properties.getBaseUrl(),
                properties.getApiVersion(),
                properties.getModel()
        );
    }

    @Override
    public AiResponse complete(AiRequest request) {
        BusinessException lastException = null;
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                return completeOnce(request);
            } catch (BusinessException ex) {
                lastException = ex;
                if (attempt == 1 && isRetryable(ex)) {
                    backoffBeforeRetry();
                    continue;
                }
                throw ex;
            }
        }
        throw lastException != null
                ? lastException
                : providerException(
                ErrorCode.AI_PROVIDER_UNAVAILABLE,
                "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                HttpStatus.SERVICE_UNAVAILABLE
        );
    }

    @Override
    public String providerName() {
        return "gemini";
    }

    private AiResponse completeOnce(AiRequest request) {
        Instant startedAt = Instant.now();
        GeminiGenerateContentRequest payload = buildRequest(request);
        try {
            GeminiGenerateContentResponse response = client.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/{apiVersion}/models/{model}:generateContent")
                            .queryParam("key", properties.getApiKey())
                            .build(properties.getApiVersion(), properties.getModel()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .exchange((ignoredRequest, responseEntity) -> {
                        if (responseEntity.getStatusCode().isError()) {
                            String body = readBodySafely(responseEntity);
                            ProviderError providerError = parseProviderError(body);
                            log.warn(
                                    "Gemini request failed status={} providerCode={} providerMessage={} latencyMs={}",
                                    responseEntity.getStatusCode().value(),
                                    providerError.code(),
                                    providerError.message(),
                                    Duration.between(startedAt, Instant.now()).toMillis()
                            );
                            throw mapStatus(responseEntity.getStatusCode().value(), body);
                        }
                        String body = readBodySafely(responseEntity);
                        try {
                            return objectMapper.readValue(body, GeminiGenerateContentResponse.class);
                        } catch (JsonProcessingException ex) {
                            throw providerException(
                                    ErrorCode.AI_INVALID_RESPONSE,
                                    "The AI provider returned an invalid response.",
                                    HttpStatus.BAD_GATEWAY
                            );
                        }
                    });

            AiResponse aiResponse = normalizeResponse(response);
            log.info(
                    "Gemini request completed model={} finishReason={} latencyMs={} totalTokens={}",
                    properties.getModel(),
                    aiResponse.getFinishReason(),
                    Duration.between(startedAt, Instant.now()).toMillis(),
                    aiResponse.getUsage() != null ? aiResponse.getUsage().getTotalTokens() : 0
            );
            return aiResponse;
        } catch (BusinessException ex) {
            throw ex;
        } catch (ResourceAccessException ex) {
            log.warn("Gemini request timed out or could not connect: {}", sanitizeLogValue(ex.getMessage()));
            throw providerException(
                    ErrorCode.AI_PROVIDER_TIMEOUT,
                    "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                    HttpStatus.GATEWAY_TIMEOUT
            );
        } catch (RestClientException ex) {
            log.warn("Gemini request failed: {}", sanitizeLogValue(ex.getMessage()));
            throw providerException(
                    ErrorCode.AI_PROVIDER_UNAVAILABLE,
                    "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }

    private GeminiGenerateContentRequest buildRequest(AiRequest request) {
        List<GeminiContent> contents = new ArrayList<>();
        if (request.getConversationHistory() != null) {
            for (AiRequest.ConversationMessage message : request.getConversationHistory()) {
                if (message == null || message.getContent() == null || message.getContent().isBlank()) {
                    continue;
                }
                String role = "assistant".equalsIgnoreCase(message.getRole()) ? "model" : "user";
                contents.add(new GeminiContent(role, List.of(new GeminiPart(message.getContent()))));
            }
        }
        contents.add(new GeminiContent("user", List.of(new GeminiPart(request.getPrompt() != null ? request.getPrompt() : ""))));

        int maxTokens = request.getMaxTokens() > 0
                ? Math.min(request.getMaxTokens(), properties.getMaxOutputTokens())
                : properties.getMaxOutputTokens();
        double temperature = request.getTemperature() >= 0
                ? request.getTemperature()
                : properties.getTemperature();

        return new GeminiGenerateContentRequest(
                request.getSystemContext() != null && !request.getSystemContext().isBlank()
                        ? new GeminiSystemInstruction(List.of(new GeminiPart(request.getSystemContext())))
                        : null,
                contents,
                new GeminiGenerationConfig(
                        temperature,
                        maxTokens,
                        request.isJsonResponse() ? MediaType.APPLICATION_JSON_VALUE : MediaType.TEXT_PLAIN_VALUE
                )
        );
    }

    private AiResponse normalizeResponse(GeminiGenerateContentResponse response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            throw providerException(
                    ErrorCode.AI_EMPTY_RESPONSE,
                    "The AI provider returned an empty response.",
                    HttpStatus.BAD_GATEWAY
            );
        }
        GeminiCandidate candidate = response.candidates().getFirst();
        String finishReason = candidate.finishReason() != null ? candidate.finishReason() : "STOP";
        if (List.of("SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII").contains(finishReason)) {
            throw providerException(
                    ErrorCode.AI_RESPONSE_BLOCKED,
                    "The AI provider blocked the response.",
                    HttpStatus.BAD_GATEWAY
            );
        }
        if (candidate.content() == null || candidate.content().parts() == null || candidate.content().parts().isEmpty()) {
            throw providerException(
                    ErrorCode.AI_EMPTY_RESPONSE,
                    "The AI provider returned an empty response.",
                    HttpStatus.BAD_GATEWAY
            );
        }
        String content = candidate.content().parts().stream()
                .map(GeminiPart::text)
                .filter(text -> text != null && !text.isBlank())
                .reduce("", String::concat);
        if (content == null || content.isBlank()) {
            throw providerException(
                    ErrorCode.AI_EMPTY_RESPONSE,
                    "The AI provider returned an empty response.",
                    HttpStatus.BAD_GATEWAY
            );
        }
        GeminiUsage usage = response.usageMetadata();
        return AiResponse.builder()
                .text(content)
                .model(properties.getModel())
                .finishReason(finishReason)
                .mocked(false)
                .usage(AiResponse.TokenUsage.builder()
                        .promptTokens(usage != null && usage.promptTokenCount() != null ? usage.promptTokenCount() : 0)
                        .completionTokens(usage != null && usage.candidatesTokenCount() != null ? usage.candidatesTokenCount() : 0)
                        .totalTokens(usage != null && usage.totalTokenCount() != null ? usage.totalTokenCount() : 0)
                        .build())
                .build();
    }

    private BusinessException mapStatus(int status, String responseBody) {
        String safeBody = responseBody != null ? responseBody.toLowerCase() : "";
        if (status == HttpStatus.BAD_REQUEST.value()) {
            return providerException(
                    ErrorCode.AI_INVALID_REQUEST,
                    "The AI provider rejected the request format.",
                    HttpStatus.BAD_GATEWAY
            );
        }
        if (status == HttpStatus.UNAUTHORIZED.value() || status == HttpStatus.FORBIDDEN.value()) {
            return providerException(
                    ErrorCode.GEMINI_AUTH_FAILED,
                    "The AI provider authentication failed.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        if (status == HttpStatus.TOO_MANY_REQUESTS.value()) {
            ErrorCode code = safeBody.contains("quota") ? ErrorCode.AI_QUOTA_EXCEEDED : ErrorCode.AI_RATE_LIMITED;
            return providerException(
                    code,
                    "The AI travel assistant is receiving too many requests. Please try again shortly.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }
        if (status >= 500) {
            return providerException(
                    ErrorCode.AI_PROVIDER_UNAVAILABLE,
                    "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        return providerException(
                ErrorCode.AI_PROVIDER_UNAVAILABLE,
                "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                HttpStatus.BAD_GATEWAY
        );
    }

    private BusinessException providerException(ErrorCode code, String message, HttpStatus status) {
        return new BusinessException(code, message, status);
    }

    private boolean isRetryable(BusinessException ex) {
        return ex.getErrorCode() == ErrorCode.AI_PROVIDER_TIMEOUT
                || ex.getErrorCode() == ErrorCode.AI_RATE_LIMITED
                || ex.getErrorCode() == ErrorCode.AI_PROVIDER_UNAVAILABLE;
    }

    private void backoffBeforeRetry() {
        try {
            Thread.sleep(250);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    private String readBodySafely(org.springframework.http.client.ClientHttpResponse responseEntity) {
        try {
            return new String(responseEntity.getBody().readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            return "";
        }
    }

    private ProviderError parseProviderError(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return new ProviderError("unknown", "No upstream error details");
        }
        try {
            var root = objectMapper.readTree(responseBody);
            var error = root.path("error");
            return new ProviderError(
                    sanitizeLogValue(error.path("status").asText(error.path("code").asText("unknown"))),
                    sanitizeLogValue(error.path("message").asText("Unknown upstream error"))
            );
        } catch (JsonProcessingException ex) {
            return new ProviderError("unparseable", "Upstream error body was not valid JSON");
        }
    }

    private String sanitizeLogValue(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        String sanitized = value.replaceAll("[\\r\\n\\t]", " ").trim();
        return sanitized.length() > 240 ? sanitized.substring(0, 240) : sanitized;
    }

    private SimpleClientHttpRequestFactory createRequestFactory(GeminiProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(properties.getConnectTimeoutSeconds()).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofSeconds(properties.getReadTimeoutSeconds()).toMillis());
        return requestFactory;
    }

    private record GeminiGenerateContentRequest(
            GeminiSystemInstruction systemInstruction,
            List<GeminiContent> contents,
            GeminiGenerationConfig generationConfig
    ) {}

    private record GeminiSystemInstruction(List<GeminiPart> parts) {}

    private record GeminiContent(String role, List<GeminiPart> parts) {}

    private record GeminiPart(String text) {}

    private record GeminiGenerationConfig(Double temperature, Integer maxOutputTokens, String responseMimeType) {}

    private record GeminiGenerateContentResponse(List<GeminiCandidate> candidates, GeminiUsage usageMetadata) {}

    private record GeminiCandidate(GeminiContent content, String finishReason) {}

    private record GeminiUsage(Integer promptTokenCount, Integer candidatesTokenCount, Integer totalTokenCount) {}

    private record ProviderError(String code, String message) {}
}
