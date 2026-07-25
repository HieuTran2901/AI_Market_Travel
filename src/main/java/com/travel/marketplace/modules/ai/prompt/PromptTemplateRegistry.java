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
            Trip request: {{naturalLanguageQuery}}
            Destination: {{destination}}
            Duration: {{durationDays}} days
            Budget: {{budget}} USD total
            Group size: {{groupSize}} people
            
            Marketplace listings. Prefer these when useful; otherwise use listingId null.
            {{listingContext}}
            
            Output contract:
            root fields: days, totalEstimatedBudget, aiSummary, highlights.
            day fields: dayNumber, theme, activities.
            activity fields: time, listingId, listingName, type, description, estimatedCost.
            Use the field name time only. Do not use startTime or endTime.
            days must contain exactly {{durationDays}} objects.
            activities must be arrays with at most {{maxActivitiesPerDay}} items per day.
            description maximum {{maxDescriptionWords}} words.
            theme maximum 8 words.
            aiSummary maximum 60 words.
            highlights maximum 5 short strings.
            Use only these type values: HOTEL, RESTAURANT, TOUR, EXPERIENCE, FREE_TIME, TRANSPORT.
            Use HH:mm for time.
            Use null for listingId when an activity is not tied to a marketplace listing.
            Use listing IDs only from the supplied marketplace listings.
            Prefer real marketplace listings when available.
            Use listingId null only when no suitable marketplace item exists.
            Do not add a repeated hotel stay activity every day unless requested.
            Do not invent listing IDs, prices, availability, ratings, provider names, or image URLs.
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
