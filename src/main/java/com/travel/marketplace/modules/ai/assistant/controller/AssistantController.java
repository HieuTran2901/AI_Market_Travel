package com.travel.marketplace.modules.ai.assistant.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantRequest;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;
import com.travel.marketplace.modules.ai.assistant.service.AssistantService;
import com.travel.marketplace.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    @PostMapping("/chat")
    public ApiResponse<AssistantResponse> chat(
            @Valid @RequestBody AssistantRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        if (userPrincipal != null) {
            request.setAuthenticatedUserId(userPrincipal.getId());
            if (request.getHistoryOwnerId() == null || !request.getHistoryOwnerId().equals(userPrincipal.getId())) {
                request.setHistory(List.of());
            }
        }
        AssistantResponse response = assistantService.chat(request);
        return ApiResponse.success("Assistant reply generated", response);
    }
}
