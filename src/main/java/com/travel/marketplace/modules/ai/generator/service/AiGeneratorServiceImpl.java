package com.travel.marketplace.modules.ai.generator.service;

import com.travel.marketplace.modules.ai.generator.dto.ListingGenerationRequest;
import com.travel.marketplace.modules.ai.generator.dto.ListingGenerationResponse;
import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiGeneratorServiceImpl implements AiGeneratorService {

    private final AiProvider aiProvider;
    private final PromptTemplateRegistry promptRegistry;

    @Override
    public ListingGenerationResponse generateListing(ListingGenerationRequest request) {
        log.info("Generating listing for prompt: {}", request.getPrompt());

        Map<String, Object> vars = new HashMap<>();
        vars.put("userMessage", request.getPrompt() != null ? request.getPrompt() : "");

        String prompt = promptRegistry.render("listing_generation", vars);

        AiRequest aiReq = AiRequest.builder()
                .prompt(prompt)
                .systemContext("You are a specialized B2B listing generator. CRITICAL INSTRUCTION: Return ONLY valid JSON matching the exact schema requested by the user. No markdown fences. No conversational prose. No explanations. No text outside JSON.")
                .jsonResponse(true)
                .maxTokens(2000)
                .temperature(0.5)
                .build();

        AiResponse aiResponse = aiProvider.complete(aiReq);

        return ListingGenerationResponse.builder()
                .rawJson(aiResponse.getText())
                .build();
    }
}
