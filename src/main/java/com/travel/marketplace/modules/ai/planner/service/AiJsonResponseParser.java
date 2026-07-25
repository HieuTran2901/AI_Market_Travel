package com.travel.marketplace.modules.ai.planner.service;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AiJsonResponseParser {

    private final ObjectMapper objectMapper;

    public <T> T parseObject(String rawContent, Class<T> targetType) {
        String json = extractJsonObject(rawContent);
        rejectPlaceholders(json);
        try {
            return objectMapper.readValue(json, targetType);
        } catch (JsonParseException ex) {
            if (isUnexpectedEnd(ex)) {
                throw truncated("AI response contained truncated JSON.");
            }
            throw invalid("AI response was not valid JSON.");
        } catch (JsonProcessingException ex) {
            throw invalid("AI response was not valid JSON.");
        }
    }

    public String extractJsonObject(String rawContent) {
        if (rawContent == null || rawContent.isBlank()) {
            throw invalid("AI response was empty.");
        }

        String text = stripSingleMarkdownFence(rawContent.trim());
        int start = text.indexOf('{');
        if (start < 0) {
            throw invalid("AI response did not contain a JSON object.");
        }

        boolean inString = false;
        boolean escaping = false;
        int depth = 0;
        for (int i = start; i < text.length(); i++) {
            char ch = text.charAt(i);

            if (escaping) {
                escaping = false;
                continue;
            }
            if (ch == '\\' && inString) {
                escaping = true;
                continue;
            }
            if (ch == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (ch == '{') {
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return text.substring(start, i + 1);
                }
                if (depth < 0) {
                    break;
                }
            }
        }

        throw truncated("AI response contained truncated JSON.");
    }

    private String stripSingleMarkdownFence(String text) {
        if (!text.startsWith("```")) {
            return text;
        }

        int firstLineEnd = text.indexOf('\n');
        int closingFence = text.lastIndexOf("```");
        if (firstLineEnd > 0 && closingFence > firstLineEnd) {
            return text.substring(firstLineEnd + 1, closingFence).trim();
        }
        return text;
    }

    private void rejectPlaceholders(String json) {
        String lower = json.toLowerCase();
        if (json.contains("[...]")
                || json.contains("...")
                || lower.contains("\"string\"")
                || lower.contains("\"example\"")
                || lower.contains("same as above")
                || lower.contains("your value here")) {
            throw invalid("AI response contained placeholders instead of itinerary data.");
        }
    }

    private BusinessException invalid(String message) {
        return new BusinessException(
                ErrorCode.AI_INVALID_STRUCTURED_RESPONSE,
                message,
                HttpStatus.BAD_GATEWAY
        );
    }

    private AiOutputTruncatedException truncated(String message) {
        return new AiOutputTruncatedException(message);
    }

    private boolean isUnexpectedEnd(JsonParseException ex) {
        String message = ex.getOriginalMessage();
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        return lower.contains("unexpected end")
                || lower.contains("end-of-input")
                || lower.contains("unexpected eof")
                || lower.contains("was expecting")
                && (lower.contains("close marker") || lower.contains("value"));
    }
}
