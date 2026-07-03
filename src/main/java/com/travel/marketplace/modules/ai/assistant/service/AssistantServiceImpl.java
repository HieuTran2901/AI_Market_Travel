package com.travel.marketplace.modules.ai.assistant.service;

import com.travel.marketplace.modules.ai.assistant.dto.AssistantMessage;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantRequest;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;
import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.service.ListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssistantServiceImpl implements AssistantService {

    private final AiProvider aiProvider;
    private final ListingService listingService;
    private final PromptTemplateRegistry promptRegistry;

    @Override
    public AssistantResponse chat(AssistantRequest request) {
        
        // 1. Fetch relevant context if needed
        String marketplaceContext = buildMarketplaceContext(request);
        
        // 2. Format conversation history
        String conversationContext = formatConversationHistory(request.getHistory());
        
        // 3. Build prompt
        Map<String, Object> vars = new HashMap<>();
        vars.put("marketplaceContext", marketplaceContext);
        vars.put("conversationContext", conversationContext);
        vars.put("userMessage", request.getMessage());
        
        String prompt = promptRegistry.render("assistant", vars);
        
        // 4. Map history for provider (optional, depending on provider implementation)
        List<AiRequest.ConversationMessage> providerHistory = new ArrayList<>();
        if (request.getHistory() != null) {
            providerHistory = request.getHistory().stream()
                    .map(m -> new AiRequest.ConversationMessage(m.getRole(), m.getContent()))
                    .collect(Collectors.toList());
        }

        // 5. Call AI Provider
        AiResponse aiResponse = aiProvider.complete(AiRequest.builder()
                .prompt(prompt)
                .conversationHistory(providerHistory)
                .maxTokens(1024)
                .temperature(0.7)
                .build());

        return AssistantResponse.builder()
                .reply(aiResponse.getText())
                .suggestedActions(generateSuggestedActions(aiResponse.getText(), request))
                .mockedAi(aiResponse.isMocked())
                .build();
    }
    
    private String buildMarketplaceContext(AssistantRequest request) {
        StringBuilder sb = new StringBuilder();
        
        // If they asked about a specific listing, inject that context
        if (request.getContextListingId() != null) {
            try {
                ListingResponse listing = listingService.getListingById(request.getContextListingId());
                sb.append("Current Listing User is Viewing:\n");
                sb.append("- ").append(listing.getTitle()).append(" (ID: ").append(listing.getId()).append(")\n");
                sb.append("  Category: ").append(listing.getCategory()).append("\n");
                sb.append("  Price: ").append(listing.getBasePrice()).append(" ").append(listing.getCurrency()).append("\n");
                sb.append("  Location: ").append(listing.getCity()).append(", ").append(listing.getCountry()).append("\n");
                sb.append("  Description: ").append(listing.getShortDesc()).append("\n\n");
            } catch (Exception e) {
                log.warn("Failed to fetch context listing {}", request.getContextListingId(), e);
            }
        }
        
        // If they asked about a destination, inject top listings there
        if (request.getContextDestination() != null) {
            try {
                ListingSearchRequest searchReq = new ListingSearchRequest();
                searchReq.setCity(request.getContextDestination());
                searchReq.setStatus("ACTIVE");
                
                List<ListingResponse> topListings = listingService.searchListings(searchReq, PageRequest.of(0, 5)).getContent();
                if (!topListings.isEmpty()) {
                    sb.append("Popular Listings in ").append(request.getContextDestination()).append(":\n");
                    for (ListingResponse l : topListings) {
                        sb.append("- ").append(l.getTitle()).append(" (ID: ").append(l.getId()).append(") - ").append(l.getBasePrice()).append(" ").append(l.getCurrency()).append("\n");
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch destination context for {}", request.getContextDestination(), e);
            }
        }
        
        if (sb.length() == 0) {
            return "General Travel Marketplace context only. No specific location or listing requested.";
        }
        
        return sb.toString();
    }
    
    private String formatConversationHistory(List<AssistantMessage> history) {
        if (history == null || history.isEmpty()) return "No prior history.";
        
        StringBuilder sb = new StringBuilder();
        for (AssistantMessage msg : history) {
            sb.append(msg.getRole().toUpperCase()).append(": ").append(msg.getContent()).append("\n");
        }
        return sb.toString();
    }
    
    private List<String> generateSuggestedActions(String aiText, AssistantRequest request) {
        // Simple heuristic for demo purposes
        List<String> actions = new ArrayList<>();
        String lowerText = aiText.toLowerCase();
        
        if (lowerText.contains("itinerary") || lowerText.contains("plan")) {
            actions.add("Can you adjust this for a lower budget?");
            actions.add("What if I want to stay for 5 days instead?");
        } else if (lowerText.contains("book") || lowerText.contains("available")) {
            actions.add("Show me some alternatives.");
        } else {
            actions.add("Can you recommend some hotels?");
            actions.add("What are the top things to do there?");
        }
        
        return actions;
    }
}
