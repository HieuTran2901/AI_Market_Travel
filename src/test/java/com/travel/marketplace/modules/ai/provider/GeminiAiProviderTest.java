package com.travel.marketplace.modules.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.ai.config.GeminiProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeminiAiProviderTest {

    private static final String API_KEY = "test-gemini-key";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void completeMapsSuccessfulTextResponse() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {"text": "A practical Gemini travel answer."}
                        ]
                      },
                      "finishReason": "STOP"
                    }
                  ],
                  "usageMetadata": {
                    "promptTokenCount": 10,
                    "candidatesTokenCount": 7,
                    "totalTokenCount": 17
                  }
                }
                """)) {
            AiResponse response = createProvider(server).complete(AiRequest.builder()
                    .prompt("Hello")
                    .maxTokens(500)
                    .temperature(0.4)
                    .build());

            assertThat(response.getText()).isEqualTo("A practical Gemini travel answer.");
            assertThat(response.getModel()).isEqualTo("gemini-2.5-flash");
            assertThat(response.getUsage().getTotalTokens()).isEqualTo(17);
            assertThat(response.isMocked()).isFalse();
            assertThat(server.lastPath()).isEqualTo("/v1beta/models/gemini-2.5-flash:generateContent");
            assertThat(server.lastQuery()).isEqualTo("key=" + API_KEY);
            JsonNode body = objectMapper.readTree(server.lastBody());
            assertThat(body.at("/generationConfig/responseMimeType").asText()).isEqualTo("text/plain");
        }
    }

    @Test
    void completeSupportsStructuredJsonModeAndConversationRoleMapping() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {"text": "{\\"days\\":[{\\"dayNumber\\":1,\\"title\\":\\"Arrival\\"}]}"}
                        ]
                      },
                      "finishReason": "STOP"
                    }
                  ]
                }
                """)) {
            AiResponse response = createProvider(server).complete(AiRequest.builder()
                    .prompt("Return itinerary JSON")
                    .systemContext("Return strict JSON.")
                    .conversationHistory(List.of(
                            new AiRequest.ConversationMessage("user", "Plan Da Lat"),
                            new AiRequest.ConversationMessage("assistant", "Previous answer")
                    ))
                    .jsonResponse(true)
                    .build());

            JsonNode body = objectMapper.readTree(server.lastBody());
            assertThat(response.getText()).contains("\"days\"");
            assertThat(body.at("/systemInstruction/parts/0/text").asText()).contains("Return strict JSON");
            assertThat(body.at("/contents/0/role").asText()).isEqualTo("user");
            assertThat(body.at("/contents/1/role").asText()).isEqualTo("model");
            assertThat(body.at("/generationConfig/responseMimeType").asText()).isEqualTo("application/json");
        }
    }

    @Test
    void completeRejectsEmptyCandidates() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, "{\"candidates\":[]}")) {
            assertThatThrownBy(() -> createProvider(server).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_EMPTY_RESPONSE);
        }
    }

    @Test
    void completeMapsBlockedResponse() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {"candidates":[{"content":{"parts":[{"text":""}]},"finishReason":"SAFETY"}]}
                """)) {
            assertThatThrownBy(() -> createProvider(server).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_RESPONSE_BLOCKED);
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
        try (ProviderServer server = ProviderServer.responding(HttpStatus.FORBIDDEN.value(), "{\"error\":{\"message\":\"bad key\"}}")) {
            assertThatThrownBy(() -> createProvider(server).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException businessException = (BusinessException) ex;
                        assertThat(businessException.getErrorCode()).isEqualTo(ErrorCode.GEMINI_AUTH_FAILED);
                        assertThat(businessException.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                        assertThat(businessException.getMessage()).doesNotContain(API_KEY);
                    });
        }
    }

    @Test
    void completeMapsQuotaRateLimitAndServerErrors() throws Exception {
        try (ProviderServer quota = ProviderServer.responding(429, "{\"error\":{\"message\":\"quota exceeded\"}}")) {
            assertThatThrownBy(() -> createProvider(quota).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_QUOTA_EXCEEDED);
            assertThat(quota.requestCount()).isEqualTo(1);
        }

        try (ProviderServer rateLimit = ProviderServer.responding(429, "{\"error\":{\"message\":\"rate limited\"}}")) {
            assertThatThrownBy(() -> createProvider(rateLimit).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_RATE_LIMITED);
            assertThat(rateLimit.requestCount()).isEqualTo(2);
        }

        try (ProviderServer serverError = ProviderServer.responding(500, "{}")) {
            assertThatThrownBy(() -> createProvider(serverError).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_PROVIDER_UNAVAILABLE);
            assertThat(serverError.requestCount()).isEqualTo(2);
        }
    }

    @Test
    void missingApiKeyFailsFast() {
        GeminiProperties properties = createProperties("http://localhost");
        properties.setApiKey("");

        assertThatThrownBy(() -> new GeminiAiProvider(properties, objectMapper, RestClient.builder()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("GEMINI_API_KEY")
                .hasMessageNotContaining(API_KEY);
    }

    private GeminiAiProvider createProvider(ProviderServer server) {
        return new GeminiAiProvider(createProperties(server.baseUrl()), objectMapper, RestClient.builder());
    }

    private GeminiProperties createProperties(String baseUrl) {
        GeminiProperties properties = new GeminiProperties();
        properties.setApiKey(API_KEY);
        properties.setBaseUrl(baseUrl);
        properties.setApiVersion("v1beta");
        properties.setModel("gemini-2.5-flash");
        properties.setMaxOutputTokens(1800);
        properties.setTemperature(0.7);
        return properties;
    }

    private static final class ProviderServer implements AutoCloseable {
        private final HttpServer server;
        private final AtomicInteger requestCount = new AtomicInteger();
        private volatile String lastPath;
        private volatile String lastQuery;
        private volatile String lastBody;

        private ProviderServer(int status, String body) throws IOException {
            server = HttpServer.create(new InetSocketAddress(0), 0);
            server.createContext("/v1beta/models/gemini-2.5-flash:generateContent", exchange -> handle(exchange, status, body));
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

        String lastPath() {
            return lastPath;
        }

        String lastQuery() {
            return lastQuery;
        }

        String lastBody() {
            return lastBody;
        }

        private void handle(HttpExchange exchange, int status, String body) throws IOException {
            requestCount.incrementAndGet();
            lastPath = exchange.getRequestURI().getPath();
            lastQuery = exchange.getRequestURI().getRawQuery();
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
