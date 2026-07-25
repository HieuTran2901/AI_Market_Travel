package com.travel.marketplace.modules.ai.provider;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.ai.config.OpenRouterProperties;
import com.travel.marketplace.modules.ai.provider.openrouter.OpenRouterChatRequest;
import com.travel.marketplace.modules.ai.provider.openrouter.OpenRouterChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
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
import java.util.Map;

@Slf4j
@Service
@ConditionalOnProperty(prefix = "ai", name = "provider", havingValue = "openrouter")
public class OpenRouterAiProvider implements AiProvider {

    private static final String DEFAULT_SYSTEM_PROMPT = """
            You are the AI travel concierge for AI Marketplace Traveler.

            Generate practical, safe, structured travel advice based only on the supplied destination, dates, budget,
            traveler preferences, and marketplace listing context.

            When creating an itinerary:
            - organize it by day
            - include morning, afternoon, and evening
            - provide concise descriptions
            - estimate costs carefully
            - do not invent listing IDs, prices, availability, ratings, or provider information
            - use only marketplace listings supplied in the context
            - clearly label assumptions
            - return valid JSON when the caller requests structured output
            """;

    private final OpenRouterProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient client;

    public OpenRouterAiProvider(
            OpenRouterProperties properties,
            ObjectMapper objectMapper,
            RestClient.Builder restClientBuilder
    ) {
        properties.validate();
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.client = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .requestFactory(createRequestFactory(properties))
                .build();
        log.info(
                "OpenRouter configuration keyPresent={} keyLength={} baseUrl={} chatPath={} model={}",
                !properties.getApiKey().isBlank(),
                properties.getApiKey().length(),
                properties.getBaseUrl(),
                properties.getChatPath(),
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

    private AiResponse completeOnce(AiRequest request) {
        Instant startedAt = Instant.now();
        OpenRouterChatRequest payload = buildRequest(request);

        try {
            OpenRouterChatResponse response = client.post()
                    .uri(properties.getChatPath())
                    .headers(headers -> {
                        if (isValidReferer(properties.getHttpReferer())) {
                            headers.set("HTTP-Referer", properties.getHttpReferer());
                        }
                        if (properties.getTitle() != null && !properties.getTitle().isBlank()) {
                            headers.set("X-Title", properties.getTitle());
                        }
                    })
                    .body(payload)
                    .exchange((ignoredRequest, responseEntity) -> {
                        if (responseEntity.getStatusCode().isError()) {
                            String body = readBodySafely(responseEntity);
                            ProviderError providerError = parseProviderError(body);
                            String requestId = responseEntity.getHeaders().getFirst("x-request-id");
                            log.warn(
                                    "OpenRouter request failed status={} providerCode={} providerMessage={} requestId={} latencyMs={}",
                                    responseEntity.getStatusCode().value(),
                                    providerError.code(),
                                    providerError.message(),
                                    sanitizeLogValue(requestId),
                                    Duration.between(startedAt, Instant.now()).toMillis()
                            );
                            throw mapStatus(responseEntity.getStatusCode().value(), body);
                        }
                        String body = readBodySafely(responseEntity);
                        try {
                            return objectMapper.readValue(body, OpenRouterChatResponse.class);
                        } catch (JsonProcessingException ex) {
                            throw providerException(
                                    ErrorCode.AI_INVALID_RESPONSE,
                                    "The AI provider returned an invalid response.",
                                    HttpStatus.BAD_GATEWAY
                            );
                        }
                    });

            AiResponse aiResponse = normalizeResponse(response, payload.model());
            long latencyMs = Duration.between(startedAt, Instant.now()).toMillis();
            log.info(
                    "OpenRouter request completed model={} finishReason={} latencyMs={} totalTokens={}",
                    aiResponse.getModel(),
                    aiResponse.getFinishReason(),
                    latencyMs,
                    aiResponse.getUsage() != null ? aiResponse.getUsage().getTotalTokens() : 0
            );
            return aiResponse;
        } catch (BusinessException ex) {
            throw ex;
        } catch (ResourceAccessException ex) {
            log.warn("OpenRouter request timed out or could not connect: {}", ex.getMessage());
            throw providerException(
                    ErrorCode.AI_PROVIDER_TIMEOUT,
                    "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                    HttpStatus.GATEWAY_TIMEOUT
            );
        } catch (RestClientException ex) {
            log.warn("OpenRouter request failed: {}", ex.getMessage());
            throw providerException(
                    ErrorCode.AI_PROVIDER_UNAVAILABLE,
                    "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        } catch (Exception ex) {
            log.warn("OpenRouter response handling failed: {}", ex.getMessage());
            throw providerException(
                    ErrorCode.AI_PROVIDER_UNAVAILABLE,
                    "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }

    @Override
    public String providerName() {
        return "openrouter";
    }

    private OpenRouterChatRequest buildRequest(AiRequest request) {
        List<OpenRouterChatRequest.Message> messages = new ArrayList<>();
        String systemContext = request.getSystemContext();
        messages.add(new OpenRouterChatRequest.Message(
                "system",
                systemContext != null && !systemContext.isBlank()
                        ? DEFAULT_SYSTEM_PROMPT + "\n\n" + systemContext
                        : DEFAULT_SYSTEM_PROMPT
        ));

        if (request.getConversationHistory() != null) {
            for (AiRequest.ConversationMessage message : request.getConversationHistory()) {
                if (message == null || message.getContent() == null || message.getContent().isBlank()) {
                    continue;
                }
                String role = "assistant".equalsIgnoreCase(message.getRole()) ? "assistant" : "user";
                messages.add(new OpenRouterChatRequest.Message(role, message.getContent()));
            }
        }

        messages.add(new OpenRouterChatRequest.Message("user", request.getPrompt() != null ? request.getPrompt() : ""));

        int maxTokens = request.getMaxTokens() > 0
                ? Math.min(request.getMaxTokens(), properties.getMaxTokens())
                : properties.getMaxTokens();
        double temperature = request.getTemperature() >= 0
                ? request.getTemperature()
                : properties.getTemperature();

        String model = request.getModelOverride() != null && !request.getModelOverride().isBlank()
                ? request.getModelOverride()
                : properties.getModel();

        return new OpenRouterChatRequest(
                model,
                messages,
                temperature,
                maxTokens,
                false,
                buildResponseFormat(request),
                buildReasoning(request)
        );
    }

    private OpenRouterChatRequest.ResponseFormat buildResponseFormat(AiRequest request) {
        if (!request.isJsonResponse()) {
            return null;
        }
        Map<String, Object> schema = request.getJsonSchema();
        if (schema == null || schema.isEmpty()) {
            return new OpenRouterChatRequest.ResponseFormat("json_object", null);
        }
        String name = request.getJsonSchemaName() != null && !request.getJsonSchemaName().isBlank()
                ? request.getJsonSchemaName()
                : "structured_response";
        return new OpenRouterChatRequest.ResponseFormat(
                "json_schema",
                new OpenRouterChatRequest.JsonSchema(name, true, schema)
        );
    }

    private OpenRouterChatRequest.Reasoning buildReasoning(AiRequest request) {
        if (!request.isJsonResponse()
                && (request.getReasoningEffort() == null || request.getReasoningEffort().isBlank())
                && !request.isExcludeReasoning()) {
            return null;
        }
        String effort = request.getReasoningEffort() != null && !request.getReasoningEffort().isBlank()
                ? request.getReasoningEffort()
                : null;
        return new OpenRouterChatRequest.Reasoning(effort, request.isExcludeReasoning() ? Boolean.TRUE : null);
    }

    private AiResponse normalizeResponse(OpenRouterChatResponse response, String requestedModel) {
        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw providerException(
                    ErrorCode.AI_EMPTY_RESPONSE,
                    "The AI provider returned an empty response.",
                    HttpStatus.BAD_GATEWAY
            );
        }

        OpenRouterChatResponse.Choice choice = response.choices().getFirst();
        String content = choice.message() != null ? choice.message().content() : null;
        String reasoning = choice.message() != null
                ? firstNonBlank(choice.message().reasoning(), choice.message().reasoningContent())
                : null;
        if (content == null || content.isBlank()) {
            throw providerException(
                    ErrorCode.AI_EMPTY_RESPONSE,
                    "The AI provider returned an empty response.",
                    HttpStatus.BAD_GATEWAY
            );
        }

        OpenRouterChatResponse.Usage usage = response.usage();
        return AiResponse.builder()
                .text(content)
                .model(firstNonBlank(response.model(), firstNonBlank(requestedModel, properties.getModel())))
                .reasoning(reasoning)
                .finishReason(choice.finishReason() != null ? choice.finishReason() : "stop")
                .mocked(false)
                .usage(AiResponse.TokenUsage.builder()
                        .promptTokens(usage != null && usage.promptTokens() != null ? usage.promptTokens() : 0)
                        .completionTokens(usage != null && usage.completionTokens() != null ? usage.completionTokens() : 0)
                        .totalTokens(usage != null && usage.totalTokens() != null ? usage.totalTokens() : 0)
                        .build())
                .build();
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }

    private BusinessException mapStatus(int status, String responseBody) {
        String safeBody = responseBody != null ? responseBody.toLowerCase() : "";
        if (status == HttpStatus.UNAUTHORIZED.value()) {
            return providerException(
                    ErrorCode.OPENROUTER_AUTH_FAILED,
                    "The AI provider authentication failed.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        if (status == HttpStatus.PAYMENT_REQUIRED.value()
                || safeBody.contains("credit")
                || safeBody.contains("quota")) {
            return providerException(
                    ErrorCode.AI_QUOTA_EXCEEDED,
                    "The AI travel assistant is temporarily unavailable. Please try again shortly.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }
        if (status == HttpStatus.TOO_MANY_REQUESTS.value()) {
            return providerException(
                    ErrorCode.AI_RATE_LIMITED,
                    "The AI travel assistant is receiving too many requests. Please try again shortly.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }
        if (status == HttpStatus.FORBIDDEN.value()) {
            return providerException(
                    ErrorCode.AI_PROVIDER_FORBIDDEN,
                    "The AI provider rejected the request.",
                    HttpStatus.SERVICE_UNAVAILABLE
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
                    sanitizeLogValue(error.path("code").asText("unknown")),
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

    private boolean isValidReferer(String value) {
        return value != null && (value.startsWith("http://") || value.startsWith("https://"));
    }

    private SimpleClientHttpRequestFactory createRequestFactory(OpenRouterProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(properties.getConnectTimeoutSeconds()).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofSeconds(properties.getReadTimeoutSeconds()).toMillis());
        return requestFactory;
    }

    private record ProviderError(String code, String message) {
    }
}
