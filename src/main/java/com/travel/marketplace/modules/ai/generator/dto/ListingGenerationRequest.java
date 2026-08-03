package com.travel.marketplace.modules.ai.generator.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingGenerationRequest {
    @NotBlank(message = "Prompt cannot be blank")
    private String prompt;
}
