package com.travel.marketplace.modules.ai.assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantRequest {
    /** The latest message from the user */
    private String message;
    
    /** The conversation history */
    private List<AssistantMessage> history;
    
    /** Optional context if the user is asking about a specific listing */
    private Long contextListingId;
    
    /** Optional context if the user is asking about a specific destination */
    private String contextDestination;
}
