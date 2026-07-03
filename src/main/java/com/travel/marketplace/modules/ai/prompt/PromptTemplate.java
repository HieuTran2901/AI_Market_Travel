package com.travel.marketplace.modules.ai.prompt;

import java.util.Map;

/**
 * Abstraction for named prompt templates.
 * Implementations can use simple string interpolation, Thymeleaf, Mustache, etc.
 */
public interface PromptTemplate {

    /** The unique name for this template */
    String name();

    /**
     * Render the template, replacing {{variable}} placeholders with values from the provided map.
     */
    String render(Map<String, Object> variables);
}
