package com.travel.marketplace.modules.ai.assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantRequest {
    /** The latest message from the user */
    private String message;
    
    /** The conversation history */
    private List<AssistantMessage> history;

    /**
     * Frontend-owned account marker for locally persisted chat history.
     * The backend uses this only to discard stale history after account switches;
     * authorization still comes from Spring Security.
     */
    private Long historyOwnerId;
    
    /** Optional context if the user is asking about a specific listing */
    private Long contextListingId;
    
    /** Optional context if the user is asking about a specific destination */
    private String contextDestination;

    /** Structured travel context carried by the chatbox between turns */
    private Map<String, Object> extractedContext;

    /** Server-populated authenticated user ID, when the assistant is called by a signed-in user. */
    private Long authenticatedUserId;
}
