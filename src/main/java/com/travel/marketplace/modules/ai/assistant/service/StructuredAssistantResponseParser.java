package com.travel.marketplace.modules.ai.assistant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class StructuredAssistantResponseParser {

    private final ObjectMapper objectMapper;

    public Optional<JsonNode> parseObject(String responseText) {
        return extractJsonObject(responseText).flatMap(this::readTree);
    }

    Optional<String> extractJsonObject(String responseText) {
        if (responseText == null || responseText.isBlank()) {
            return Optional.empty();
        }

        String text = stripCodeFence(stripBom(responseText.trim()));
        int start = text.indexOf('{');
        if (start < 0) {
            return Optional.empty();
        }

        boolean inString = false;
        boolean escaped = false;
        int depth = 0;
        for (int i = start; i < text.length(); i++) {
            char ch = text.charAt(i);
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (ch == '\\') {
                    escaped = true;
                } else if (ch == '"') {
                    inString = false;
                }
                continue;
            }

            if (ch == '"') {
                inString = true;
            } else if (ch == '{') {
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return Optional.of(text.substring(start, i + 1));
                }
                if (depth < 0) {
                    return Optional.empty();
                }
            }
        }

        return Optional.empty();
    }

    private Optional<JsonNode> readTree(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            return node != null && node.isObject() ? Optional.of(node) : Optional.empty();
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private String stripBom(String text) {
        return !text.isEmpty() && text.charAt(0) == '\uFEFF' ? text.substring(1) : text;
    }

    private String stripCodeFence(String text) {
        String stripped = text.trim();
        if (!stripped.startsWith("```")) {
            return stripped;
        }

        int firstLineEnd = stripped.indexOf('\n');
        int closingFence = stripped.lastIndexOf("```");
        if (firstLineEnd >= 0 && closingFence > firstLineEnd) {
            return stripped.substring(firstLineEnd + 1, closingFence).trim();
        }
        return stripped;
    }
}
