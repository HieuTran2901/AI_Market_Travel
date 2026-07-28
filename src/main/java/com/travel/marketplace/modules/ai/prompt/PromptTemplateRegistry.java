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
        register(createTemplate("intent_classification",
            """
            You are the intent router for an AI travel concierge.
            Your job is to classify the user's message into exactly one of the following intents:
            - GENERAL_CHAT: For greetings, casual conversation, general questions, asking for help, or asking about the assistant's capabilities.
            - MARKETPLACE_RECOMMENDATION: For when the user asks for suggestions or recommendations (e.g., "suggest a hotel", "where should I eat", "places under 500k").
            - MARKETPLACE_SEARCH: For when the user searches for a specific listing or type of accommodation.
            - FLIGHT_SEARCH: For when the user wants to find, search, or book flights (vé máy bay, chuyến bay).
            - TRIP_PLANNER: For when the user wants to plan a trip, build an itinerary, or organize a schedule.
            - ITINERARY: For when the user wants to adjust an existing itinerary.
            - BOOKING: For booking-related help.
            - UNKNOWN: If the intent is unclear.
            
            You must also detect the language of the user's message ("vi" for Vietnamese, "en" for English).
            
            Current user message: {{userMessage}}
            Recent conversation history: {{history}}
            
            Return ONLY valid JSON in this exact format:
            {
              "intent": "GENERAL_CHAT",
              "language": "vi"
            }
            """
        ));

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
            
            You MUST answer ONLY in the user's language: {{userLanguage}}.
            Never switch to English unless the user explicitly changes language.
            If the user speaks Vietnamese:
            - explain in Vietnamese
            - recommendations in Vietnamese
            - summaries in Vietnamese
            
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
            
            You MUST answer ONLY in the user's language: {{userLanguage}}.
            Never switch to English unless the user explicitly changes language.
            If the user speaks Vietnamese:
            - explain in Vietnamese
            - recommendations in Vietnamese
            - summaries in Vietnamese
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
            
            You MUST answer ONLY in the user's language: {{userLanguage}}.
            Never switch to English unless the user explicitly changes language.
            If the user speaks Vietnamese:
            - explain in Vietnamese
            - recommendations in Vietnamese
            - summaries in Vietnamese
            
            Respond naturally and helpfully. If you reference specific listings, use their exact names from the context.
            Keep responses focused and actionable.
            """
        ));

        register(createTemplate("flight_extraction",
            """
            Extract flight search parameters from the user's natural language request.
            Return a JSON object with the following fields:
            {
              "departure_city": "City name or null",
              "arrival_city": "City name or null",
              "departure_date": "YYYY-MM-DD or null if not exact",
              "return_date": "YYYY-MM-DD or null if not exact",
              "flexible_date_window": "integer number of days if specified, or null",
              "budget": "numeric budget limit in VND or null",
              "trip_type": "ONE_WAY or ROUND_TRIP",
              "passengers": "integer number of passengers, default 1",
              "preferred_airline": "airline name or null"
            }
            
            Context:
            Current date: {{currentDate}}
            Previous destination context: {{contextDestination}}
            User query: {{naturalLanguageQuery}}
            
            Rules:
            1. ONLY output valid JSON. No markdown, no explanations.
            2. Match Vietnamese or English cities (e.g., 'Sài Gòn', 'TPHCM' -> 'Ho Chi Minh City').
            3. If the user mentions a number of days (e.g. 'bay trong 15 ngày'), extract 15 as flexible_date_window.
            4. Parse budget to a number (e.g. 'dưới 2 triệu' -> 2000000).
            5. MUST output dates strictly in YYYY-MM-DD format. Resolve relative dates (e.g. 'ngày 1/8' -> '2026-08-01', 'next weekend') using Current date.
            6. Only extract a date if explicitly requested; otherwise leave as null.
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
