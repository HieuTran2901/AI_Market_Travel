package com.travel.marketplace.modules.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "groq")
public class GroqProperties {

    private String apiKey = "";
    private String baseUrl = "https://api.groq.com/openai/v1";
    private String chatPath = "/chat/completions";
    private String model = "openai/gpt-oss-120b";
    private int connectTimeoutSeconds = 10;
    private int readTimeoutSeconds = 90;
    private int maxTokens = 6000;
    private double temperature = 0.7;

    public void validate() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GROQ_API_KEY is not configured");
        }
        if (apiKey.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())) {
            throw new IllegalStateException("GROQ_API_KEY must contain only the Groq secret");
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("groq.base-url is required");
        }
        if (chatPath == null || chatPath.isBlank()) {
            throw new IllegalStateException("groq.chat-path is required");
        }
        if (model == null || model.isBlank()) {
            throw new IllegalStateException("groq.model is required");
        }
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = normalizeSecret(apiKey);
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getChatPath() {
        return chatPath;
    }

    public void setChatPath(String chatPath) {
        this.chatPath = chatPath;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getConnectTimeoutSeconds() {
        return connectTimeoutSeconds;
    }

    public void setConnectTimeoutSeconds(int connectTimeoutSeconds) {
        this.connectTimeoutSeconds = connectTimeoutSeconds;
    }

    public int getReadTimeoutSeconds() {
        return readTimeoutSeconds;
    }

    public void setReadTimeoutSeconds(int readTimeoutSeconds) {
        this.readTimeoutSeconds = readTimeoutSeconds;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }

    public void setMaxOutputTokens(int maxOutputTokens) {
        this.maxTokens = maxOutputTokens;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    private String normalizeSecret(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.trim();
        if (normalized.length() >= 2) {
            char first = normalized.charAt(0);
            char last = normalized.charAt(normalized.length() - 1);
            if ((first == '\'' && last == '\'') || (first == '"' && last == '"')) {
                normalized = normalized.substring(1, normalized.length() - 1).trim();
            }
        }
        return normalized;
    }
}
