package com.travel.marketplace.modules.ai.assistant.controller;

import com.travel.marketplace.modules.ai.assistant.dto.AssistantMessage;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantRequest;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;
import com.travel.marketplace.modules.ai.assistant.service.AssistantService;
import com.travel.marketplace.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssistantControllerTest {

    @Mock
    private AssistantService assistantService;

    @Test
    void chatDropsHistoryWhenHistoryOwnerDoesNotMatchAuthenticatedUser() {
        AssistantController controller = new AssistantController(assistantService);
        AssistantRequest request = AssistantRequest.builder()
                .message("hello")
                .historyOwnerId(99L)
                .history(List.of(AssistantMessage.builder().role("user").content("private previous user text").build()))
                .build();
        when(assistantService.chat(any())).thenReturn(AssistantResponse.builder().message("Hello").build());

        controller.chat(request, principal(7L));

        ArgumentCaptor<AssistantRequest> captor = ArgumentCaptor.forClass(AssistantRequest.class);
        verify(assistantService).chat(captor.capture());
        assertThat(captor.getValue().getAuthenticatedUserId()).isEqualTo(7L);
        assertThat(captor.getValue().getHistory()).isEmpty();
    }

    @Test
    void chatKeepsHistoryWhenHistoryOwnerMatchesAuthenticatedUser() {
        AssistantController controller = new AssistantController(assistantService);
        List<AssistantMessage> history = List.of(AssistantMessage.builder().role("user").content("own text").build());
        AssistantRequest request = AssistantRequest.builder()
                .message("continue")
                .historyOwnerId(7L)
                .history(history)
                .build();
        when(assistantService.chat(any())).thenReturn(AssistantResponse.builder().message("Done").build());

        controller.chat(request, principal(7L));

        ArgumentCaptor<AssistantRequest> captor = ArgumentCaptor.forClass(AssistantRequest.class);
        verify(assistantService).chat(captor.capture());
        assertThat(captor.getValue().getAuthenticatedUserId()).isEqualTo(7L);
        assertThat(captor.getValue().getHistory()).isEqualTo(history);
    }

    private UserPrincipal principal(Long id) {
        return new UserPrincipal(id, "user" + id + "@example.com", "secret", true, List.of());
    }
}
