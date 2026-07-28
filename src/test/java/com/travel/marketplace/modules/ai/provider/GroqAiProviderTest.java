package com.travel.marketplace.modules.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.ai.config.AiProperties;
import com.travel.marketplace.modules.ai.config.GroqProperties;
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

class GroqAiProviderTest {

    private static final String API_KEY = "test-groq-key";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void completeMapsSuccessfulTextResponse() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {
                  "id": "chatcmpl-test",
                  "model": "openai/gpt-oss-120b",
                  "choices": [
                    {
                      "index": 0,
                      "message": {
                        "role": "assistant",
                        "content": "A practical Groq travel answer."
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

            assertThat(response.getText()).isEqualTo("A practical Groq travel answer.");
            assertThat(response.getModel()).isEqualTo("openai/gpt-oss-120b");
            assertThat(response.getUsage().getTotalTokens()).isEqualTo(20);
            assertThat(response.isMocked()).isFalse();
            assertThat(server.lastAuthorization()).isEqualTo("Bearer " + API_KEY);
            assertThat(server.lastPath()).isEqualTo("/chat/completions");

            JsonNode body = objectMapper.readTree(server.lastBody());
            assertThat(body.at("/model").asText()).isEqualTo("openai/gpt-oss-120b");
            assertThat(body.at("/messages/0/role").asText()).isEqualTo("system");
            assertThat(body.at("/messages/1/role").asText()).isEqualTo("user");
            assertThat(body.at("/max_tokens").asInt()).isEqualTo(500);
        }
    }

    @Test
    void completeUsesGlobalModelOverrideAndJsonObjectMode() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {"choices":[{"index":0,"message":{"role":"assistant","content":"{\\"ok\\":true}"},"finish_reason":"stop"}]}
                """)) {
            AiProperties aiProperties = new AiProperties();
            aiProperties.setModel("llama-3.1-8b-instant");
            GroqAiProvider provider = new GroqAiProvider(createProperties(server.baseUrl()), aiProperties, objectMapper, RestClient.builder());

            provider.complete(AiRequest.builder()
                    .prompt("Return JSON")
                    .systemContext("Return strict JSON.")
                    .conversationHistory(List.of(
                            new AiRequest.ConversationMessage("user", "Plan Da Lat"),
                            new AiRequest.ConversationMessage("assistant", "Previous answer")
                    ))
                    .jsonResponse(true)
                    .build());

            JsonNode body = objectMapper.readTree(server.lastBody());
            assertThat(body.at("/model").asText()).isEqualTo("llama-3.1-8b-instant");
            assertThat(body.at("/response_format/type").asText()).isEqualTo("json_object");
            assertThat(body.at("/messages/0/content").asText()).contains("Return strict JSON");
            assertThat(body.at("/messages/1/role").asText()).isEqualTo("user");
            assertThat(body.at("/messages/2/role").asText()).isEqualTo("assistant");
            assertThat(server.lastBody()).doesNotContain("reasoning");
            assertThat(server.lastBody()).doesNotContain("HTTP-Referer");
        }
    }

    @Test
    void completeUsesRequestModelOverrideBeforeConfigurationModel() throws Exception {
        try (ProviderServer server = ProviderServer.responding(200, """
                {"choices":[{"index":0,"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}]}
                """)) {
            createProvider(server).complete(AiRequest.builder()
                    .prompt("Hello")
                    .modelOverride("qwen/qwen3-32b")
                    .build());

            JsonNode body = objectMapper.readTree(server.lastBody());
            assertThat(body.at("/model").asText()).isEqualTo("qwen/qwen3-32b");
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
                        assertThat(businessException.getErrorCode()).isEqualTo(ErrorCode.GROQ_AUTH_FAILED);
                        assertThat(businessException.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                        assertThat(businessException.getMessage()).doesNotContain(API_KEY);
                    });
        }
    }

    @Test
    void completeMapsInvalidRequestModelNotFoundRateLimitAndServerErrors() throws Exception {
        try (ProviderServer badRequest = ProviderServer.responding(400, "{\"error\":{\"message\":\"bad request\"}}")) {
            assertThatThrownBy(() -> createProvider(badRequest).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.AI_INVALID_REQUEST);
        }

        try (ProviderServer modelNotFound = ProviderServer.responding(404, "{\"error\":{\"message\":\"model not found\"}}")) {
            assertThatThrownBy(() -> createProvider(modelNotFound).complete(AiRequest.builder().prompt("Hello").build()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.GROQ_MODEL_NOT_FOUND);
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
        GroqProperties properties = createProperties("http://localhost");
        properties.setApiKey("");

        assertThatThrownBy(() -> new GroqAiProvider(properties, new AiProperties(), objectMapper, RestClient.builder()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("GROQ_API_KEY")
                .hasMessageNotContaining(API_KEY);
    }

    @Test
    void rejectsBearerPrefixInsteadOfSendingDuplicateScheme() {
        GroqProperties properties = createProperties("http://localhost");
        properties.setApiKey("Bearer " + API_KEY);

        assertThatThrownBy(() -> new GroqAiProvider(properties, new AiProperties(), objectMapper, RestClient.builder()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("only the Groq secret")
                .hasMessageNotContaining(API_KEY);
    }

    private GroqAiProvider createProvider(ProviderServer server) {
        return new GroqAiProvider(createProperties(server.baseUrl()), new AiProperties(), objectMapper, RestClient.builder());
    }

    private GroqProperties createProperties(String baseUrl) {
        GroqProperties properties = new GroqProperties();
        properties.setApiKey(API_KEY);
        properties.setBaseUrl(baseUrl);
        properties.setChatPath("/chat/completions");
        properties.setModel("openai/gpt-oss-120b");
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
