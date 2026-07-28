package com.travel.marketplace.modules.ai.assistant.service;

import com.travel.marketplace.modules.ai.assistant.dto.AssistantRequest;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;


public interface AssistantService {
    AssistantResponse chat(AssistantRequest request);
}
