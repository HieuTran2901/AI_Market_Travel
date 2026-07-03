package com.travel.marketplace.modules.ai.assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantMessage {
    /** "user" or "assistant" */
    private String role;
    private String content;
}
