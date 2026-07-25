package com.travel.marketplace.modules.ai.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.ai.config.GeminiProperties;
import com.travel.marketplace.modules.ai.config.OpenRouterProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class OpenRouterContextTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withBean(ObjectMapper.class, ObjectMapper::new)
            .withBean(RestClient.Builder.class, RestClient::builder)
            .withBean(OpenRouterProperties.class, () -> {
                OpenRouterProperties properties = new OpenRouterProperties();
                properties.setApiKey("test-key");
                properties.setBaseUrl("http://localhost");
                properties.setChatPath("/chat/completions");
                properties.setModel("test-model");
                return properties;
            })
            .withBean(GeminiProperties.class, () -> {
                GeminiProperties properties = new GeminiProperties();
                properties.setApiKey("test-gemini-key");
                properties.setBaseUrl("http://localhost");
                properties.setApiVersion("v1beta");
                properties.setModel("test-model");
                return properties;
            })
            .withUserConfiguration(OpenRouterAiProvider.class, MockAiProvider.class, GeminiAiProvider.class);

    @Test
    void openRouterProviderLoadsAsTheOnlyAiProvider() {
        contextRunner.withPropertyValues("ai.provider=openrouter").run(context -> {
            assertThat(context).hasSingleBean(AiProvider.class);
            assertThat(context.getBean(AiProvider.class)).isInstanceOf(OpenRouterAiProvider.class);
            assertThat(context).doesNotHaveBean(MockAiProvider.class);
            assertThat(context).doesNotHaveBean(GeminiAiProvider.class);
        });
    }

    @Test
    void geminiProviderLoadsAsTheOnlyAiProvider() {
        contextRunner.withPropertyValues("ai.provider=gemini").run(context -> {
            assertThat(context).hasSingleBean(AiProvider.class);
            assertThat(context.getBean(AiProvider.class)).isInstanceOf(GeminiAiProvider.class);
            assertThat(context).doesNotHaveBean(MockAiProvider.class);
            assertThat(context).doesNotHaveBean(OpenRouterAiProvider.class);
        });
    }

    @Test
    void mockProviderLoadsAsTheOnlyAiProvider() {
        contextRunner.withPropertyValues("ai.provider=mock").run(context -> {
            assertThat(context).hasSingleBean(AiProvider.class);
            assertThat(context.getBean(AiProvider.class)).isInstanceOf(MockAiProvider.class);
            assertThat(context).doesNotHaveBean(GeminiAiProvider.class);
            assertThat(context).doesNotHaveBean(OpenRouterAiProvider.class);
        });
    }
}
