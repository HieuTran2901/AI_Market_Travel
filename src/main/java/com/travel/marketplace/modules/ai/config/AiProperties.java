package com.travel.marketplace.modules.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI module configuration properties.
 * Loaded from application.yml under the `ai:` key.
 * Keeping AI configuration completely separate from business logic.
 */
@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    /** Active provider: mock | gemini | openrouter | openai | anthropic */
    private String provider = "mock";

    private Gemini gemini = new Gemini();
    private OpenAi openai = new OpenAi();
    private Anthropic anthropic = new Anthropic();

    @Data
    public static class Gemini {
        private String apiKey = "";
        private String model = "gemini-1.5-flash";
        private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";
        private int maxTokens = 2048;
        private double temperature = 0.7;
    }

    @Data
    public static class OpenAi {
        private String apiKey = "";
        private String model = "gpt-4o-mini";
        private String baseUrl = "https://api.openai.com/v1";
        private int maxTokens = 2048;
        private double temperature = 0.7;
    }

    @Data
    public static class Anthropic {
        private String apiKey = "";
        private String model = "claude-3-haiku-20240307";
        private String baseUrl = "https://api.anthropic.com";
        private int maxTokens = 2048;
        private double temperature = 0.7;
    }
}
