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
public class AssistantResponse {
    private String reply;
    
    /** Optional suggested follow-up actions/questions */
    private List<String> suggestedActions;
    
    private boolean mockedAi;
}
