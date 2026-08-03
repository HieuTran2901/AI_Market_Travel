package com.travel.marketplace.modules.ai.generator.service;

import com.travel.marketplace.modules.ai.generator.dto.ListingGenerationRequest;
import com.travel.marketplace.modules.ai.generator.dto.ListingGenerationResponse;

public interface AiGeneratorService {
    ListingGenerationResponse generateListing(ListingGenerationRequest request);
}
