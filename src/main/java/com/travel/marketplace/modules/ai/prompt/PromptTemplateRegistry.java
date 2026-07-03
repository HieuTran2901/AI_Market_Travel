package com.travel.marketplace.modules.ai.prompt;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Central registry for all named prompt templates.
 * Business services look up templates by name and render them with context variables.
 * Templates can be extended without modifying calling services.
 */
@Slf4j
@Component
public class PromptTemplateRegistry {

    private final Map<String, PromptTemplate> templates = new HashMap<>();

    @PostConstruct
    public void registerBuiltInTemplates() {
        register(createTemplate("recommendation",
            """
            You are an expert travel recommendation AI for a Vietnamese travel marketplace.
            
            User preferences:
            - Destination: {{destination}}
            - Budget: {{budget}} USD per person
            - Travel dates: {{startDate}} to {{endDate}}
            - Group size: {{groupSize}} people
            - Interests: {{interests}}
            
            Available marketplace listings (real data):
            {{listingContext}}
            
            Based on these preferences and available listings, provide:
            1. A brief explanation of why each recommended listing suits the traveler
            2. Rank them from best to least match
            3. Keep each explanation concise (2-3 sentences)
            4. Reference specific listing names from the context above whenever possible
            
            Format your response as a JSON array with fields: listingId, score (0-100), reasoning.
            """
        ));

        register(createTemplate("trip_plan",
            """
            You are an AI travel planner for a Vietnamese travel marketplace.
            
            Trip request: {{naturalLanguageQuery}}
            Destination: {{destination}}
            Duration: {{durationDays}} days
            Budget: {{budget}} USD total
            Group size: {{groupSize}} people
            
            Available marketplace listings (real data — prefer these over generic suggestions):
            {{listingContext}}
            
            Generate a detailed day-by-day itinerary that:
            1. References specific listings from the context above by name
            2. Groups activities logically by location and time of day
            3. Provides realistic time estimates
            4. Includes an estimated budget breakdown
            5. Suggests alternatives when a listing may be fully booked
            
            Format as structured JSON with: days (array of {dayNumber, theme, activities[{time, listingId?, listingName, type, description, estimatedCost}]}), totalEstimatedBudget, aiSummary.
            """
        ));

        register(createTemplate("assistant",
            """
            You are a knowledgeable, friendly AI travel assistant for an online travel marketplace in Vietnam.
            
            Your role:
            - Answer travel questions clearly and concisely
            - Suggest listings from the marketplace when relevant
            - Help refine itineraries
            - Suggest alternatives when something is unavailable
            
            Available marketplace context:
            {{marketplaceContext}}
            
            Current conversation context:
            {{conversationContext}}
            
            User message: {{userMessage}}
            
            Respond naturally and helpfully. If you reference specific listings, use their exact names from the context.
            Keep responses focused and actionable.
            """
        ));

        log.info("PromptTemplateRegistry initialized with {} templates: {}", templates.size(), templates.keySet());
    }

    public void register(PromptTemplate template) {
        templates.put(template.name(), template);
    }

    public Optional<PromptTemplate> get(String name) {
        return Optional.ofNullable(templates.get(name));
    }

    public String render(String templateName, Map<String, Object> variables) {
        return get(templateName)
                .map(t -> t.render(variables))
                .orElseThrow(() -> new IllegalArgumentException("Prompt template not found: " + templateName));
    }

    private PromptTemplate createTemplate(String name, String template) {
        return new PromptTemplate() {
            @Override
            public String name() { return name; }

            @Override
            public String render(Map<String, Object> variables) {
                String result = template;
                Pattern pattern = Pattern.compile("\\{\\{(\\w+)}}");
                Matcher matcher = pattern.matcher(result);
                StringBuilder sb = new StringBuilder();
                while (matcher.find()) {
                    String key = matcher.group(1);
                    Object value = variables.getOrDefault(key, "");
                    matcher.appendReplacement(sb, Matcher.quoteReplacement(value != null ? value.toString() : ""));
                }
                matcher.appendTail(sb);
                return sb.toString();
            }
        };
    }
}
