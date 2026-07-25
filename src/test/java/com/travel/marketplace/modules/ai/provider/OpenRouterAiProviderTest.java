package com.travel.marketplace.modules.ai.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.ai.config.OpenRouterProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OpenRouterAiProviderTest {

    private static final String API_KEY = "test-openrouter-key";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void completeMapsSuccessfulTextResponse() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {
                  "id": "chatcmpl-test",
                  "choices": [
                    {
                      "index": 0,
                      "message": {
                        "role": "assistant",
                        "content": "A practical travel answer."
                      },
                      "finish_reason": "stop"
                    }
                  ],
                  "usage": {
                    "prompt_tokens": 12,
                    "completion_tokens": 8,
                    "total_tokens": 20
                  }
                }
                """)) {
            AiResponse response = createProvider(server).complete(AiRequest.builder()
                    .prompt("Plan a trip to Da Nang")
                    .maxTokens(500)
                    .temperature(0.4)
                    .build());

            assertThat(response.getText()).isEqualTo("A practical travel answer.");
            assertThat(response.getModel()).isEqualTo("nvidia/nemotron-3-super-120b-a12b:free");
            assertThat(response.getUsage().getTotalTokens()).isEqualTo(20);
            assertThat(response.isMocked()).isFalse();
            assertThat(server.lastAuthorization()).isEqualTo("Bearer " + API_KEY);
            assertThat(server.lastPath()).isEqualTo("/chat/completions");
        }
    }

    @Test
    void completeSupportsStructuredItineraryJsonContent() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {
                  "choices": [
                    {
                      "index": 0,
                      "message": {
                        "role": "assistant",
                        "content": "{\\"days\\":[{\\"dayNumber\\":1,\\"theme\\":\\"Arrival\\",\\"activities\\":[]}],\\"totalEstimatedBudget\\":100,\\"aiSummary\\":\\"Ready\\"}"
                      },
                      "finish_reason": "stop"
                    }
                  ]
                }
                """)) {
            AiResponse response = createProvider(server).complete(AiRequest.builder()
                    .prompt("Return itinerary JSON")
                    .systemContext("Return only JSON.")
                    .jsonResponse(true)
                    .build());

            assertThat(response.getText()).contains("\"days\"");
            assertThat(server.lastBody()).contains("\"response_format\"");
            assertThat(server.lastBody()).contains("\"json_object\"");
        }
    }

    @Test
    void completeUsesMessageContentOnlyAndPreservesSeparateReasoning() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {
                  "model": "google/gemini-2.0-flash-001",
                  "choices": [
                    {
                      "index": 0,
                      "message": {
                        "role": "assistant",
                        "reasoning": "We need to plan a valid itinerary.",
                        "reasoning_content": "Hidden chain of thought.",
                        "content": "{\\"days\\":[{\\"dayNumber\\":1,\\"theme\\":\\"Arrival\\",\\"activities\\":[]}],\\"totalEstimatedBudget\\":0,\\"aiSummary\\":\\"Ready\\",\\"highlights\\":[]}"
                      },
                      "finish_reason": "stop"
                    }
                  ],
                  "usage": {
                    "completion_tokens": 42
                  }
                }
                """)) {
            AiResponse response = createProvider(server).complete(AiRequest.builder()
                    .prompt("Return itinerary JSON")
                    .jsonResponse(true)
                    .build());

            assertThat(response.getText()).startsWith("{");
            assertThat(response.getText()).doesNotContain("We need");
            assertThat(response.getReasoning()).isEqualTo("We need to plan a valid itinerary.");
            assertThat(response.getModel()).isEqualTo("google/gemini-2.0-flash-001");
            assertThat(response.getUsage().getCompletionTokens()).isEqualTo(42);
        }
    }

    @Test
    void completeSendsModelOverrideJsonSchemaAndReasoningControls() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {"choices":[{"index":0,"message":{"role":"assistant","content":"{\\"ok\\":true}"},"finish_reason":"stop"}]}
                """)) {
            createProvider(server).complete(AiRequest.builder()
                    .prompt("Return JSON")
                    .jsonResponse(true)
                    .modelOverride("google/gemini-2.0-flash-001")
                    .jsonSchemaName("trip_plan")
                    .jsonSchema(Map.of(
                            "type", "object",
                            "properties", Map.of("ok", Map.of("type", "boolean")),
                            "required", java.util.List.of("ok"),
                            "additionalProperties", false
                    ))
                    .reasoningEffort("low")
                    .excludeReasoning(true)
                    .build());

            assertThat(server.lastBody()).contains("\"model\":\"google/gemini-2.0-flash-001\"");
            assertThat(server.lastBody()).contains("\"type\":\"json_schema\"");
            assertThat(server.lastBody()).contains("\"name\":\"trip_plan\"");
            assertThat(server.lastBody()).contains("\"strict\":true");
            assertThat(server.lastBody()).contains("\"reasoning\"");
            assertThat(server.lastBody()).contains("\"effort\":\"low\"");
            assertThat(server.lastBody()).contains("\"exclude\":true");
        }
    }

    @Test
    void completeRejectsEmptyChoices() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, "{\"choices\":[]}")) {
            assertThatThrownBy(() -> createProvider(server).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_EMPTY_RESPONSE);
        }
    }

    @Test
    void completeMapsMalformedJson() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, "not-json")) {
            assertThatThrownBy(() -> createProvider(server).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_INVALID_RESPONSE);
        }
    }

    @Test
    void completeMapsAuthFailureWithoutLeakingApiKey() throws Exception {
        try (ProviderServer server = ProviderServer.responding(HttpStatus.UNAUTHORIZED.value(), "{\"error\":{\"message\":\"bad key\"}}")) {
            assertThatThrownBy(() -> createProvider(server).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException businessException = (BusinessException) ex;
                        assertThat(businessException.getErrorCode()).isEqualTo(ErrorCode.OPENROUTER_AUTH_FAILED);
                        assertThat(businessException.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                        assertThat(businessException.getMessage()).doesNotContain(API_KEY);
                    });
        }
    }

    @Test
    void completeMapsQuotaAndForbiddenSeparatelyFromAuthentication() throws Exception {
        try (ProviderServer quotaServer = ProviderServer.responding(402, "{\"error\":{\"code\":402,\"message\":\"Insufficient credits\"}}")) {
            assertThatThrownBy(() -> createProvider(quotaServer).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_QUOTA_EXCEEDED);
        }

        try (ProviderServer forbiddenServer = ProviderServer.responding(403, "{\"error\":{\"code\":403,\"message\":\"Forbidden\"}}")) {
            assertThatThrownBy(() -> createProvider(forbiddenServer).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_PROVIDER_FORBIDDEN);
        }
    }

    @Test
    void completeMapsRateLimitWithOneRetry() throws Exception {
        try (ProviderServer server = ProviderServer.responding(HttpStatus.TOO_MANY_REQUESTS.value(), "")) {
            assertThatThrownBy(() -> createProvider(server).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_RATE_LIMITED);
            assertThat(server.requestCount()).isEqualTo(2);
        }
    }

    @Test
    void completeMapsUpstreamServerErrorWithOneRetry() throws Exception {
        try (ProviderServer server = ProviderServer.responding(HttpStatus.BAD_GATEWAY.value(), "")) {
            assertThatThrownBy(() -> createProvider(server).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_PROVIDER_UNAVAILABLE);
            assertThat(server.requestCount()).isEqualTo(2);
        }
    }

    @Test
    void missingApiKeyFailsFast() {
        OpenRouterProperties properties = createProperties("http://localhost");
        properties.setApiKey("");

        assertThatThrownBy(() -> new OpenRouterAiProvider(properties, objectMapper, RestClient.builder()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("OPENROUTER_API_KEY")
                .hasMessageNotContaining(API_KEY);
    }

    @Test
    void blankApiKeyFailsFast() {
        OpenRouterProperties properties = createProperties("http://localhost");
        properties.setApiKey("   ");

        assertThatThrownBy(() -> new OpenRouterAiProvider(properties, objectMapper, RestClient.builder()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("OPENROUTER_API_KEY is not configured");
    }

    @Test
    void trimsWhitespaceAndAccidentalOuterQuotesFromAuthorizationHeader() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {"choices":[{"index":0,"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}]}
                """)) {
            OpenRouterProperties properties = createProperties(server.baseUrl());
            properties.setApiKey("  '" + API_KEY + "'  ");
            OpenRouterAiProvider provider = new OpenRouterAiProvider(properties, objectMapper, RestClient.builder());

            provider.complete(AiRequest.builder().prompt("Hello").build());

            assertThat(server.lastAuthorization()).isEqualTo("Bearer " + API_KEY);
            assertThat(server.lastAuthorization()).doesNotContain("'");
        }
    }

    @Test
    void rejectsBearerPrefixInsteadOfSendingDuplicateScheme() {
        OpenRouterProperties properties = createProperties("http://localhost");
        properties.setApiKey("Bearer " + API_KEY);

        assertThatThrownBy(() -> new OpenRouterAiProvider(properties, objectMapper, RestClient.builder()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("only the OpenRouter secret")
                .hasMessageNotContaining(API_KEY);
    }

    private OpenRouterAiProvider createProvider(ProviderServer server) {
        return new OpenRouterAiProvider(createProperties(server.baseUrl()), objectMapper, RestClient.builder());
    }

    private OpenRouterProperties createProperties(String baseUrl) {
        OpenRouterProperties properties = new OpenRouterProperties();
        properties.setApiKey(API_KEY);
        properties.setBaseUrl(baseUrl);
        properties.setChatPath("/chat/completions");
        properties.setModel("nvidia/nemotron-3-super-120b-a12b:free");
        properties.setMaxTokens(1800);
        properties.setTemperature(0.7);
        return properties;
    }

    private static final class ProviderServer implements AutoCloseable {
        private final HttpServer server;
        private final AtomicInteger requestCount = new AtomicInteger();
        private volatile String lastAuthorization;
        private volatile String lastPath;
        private volatile String lastBody;

        private ProviderServer(int status, String body) throws IOException {
            server = HttpServer.create(new InetSocketAddress(0), 0);
            server.createContext("/chat/completions", exchange -> handle(exchange, status, body));
            server.start();
        }

        static ProviderServer responding(int status, String body) throws IOException {
            return new ProviderServer(status, body);
        }

        String baseUrl() {
            return "http://localhost:" + server.getAddress().getPort();
        }

        int requestCount() {
            return requestCount.get();
        }

        String lastAuthorization() {
            return lastAuthorization;
        }

        String lastPath() {
            return lastPath;
        }

        String lastBody() {
            return lastBody;
        }

        private void handle(HttpExchange exchange, int status, String body) throws IOException {
            requestCount.incrementAndGet();
            lastAuthorization = exchange.getRequestHeaders().getFirst("Authorization");
            lastPath = exchange.getRequestURI().getPath();
            lastBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        }

        @Override
        public void close() {
            server.stop(0);
        }
    }
}
