package com.travel.marketplace.modules.ai.planner.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import org.springframework.http.HttpStatus;

public class AiOutputTruncatedException extends BusinessException {

    private final String diagnosticReason;

    public AiOutputTruncatedException(String diagnosticReason) {
        super(
                ErrorCode.AI_OUTPUT_TRUNCATED,
                "The AI itinerary was incomplete. Please try again.",
                HttpStatus.BAD_GATEWAY
        );
        this.diagnosticReason = diagnosticReason;
    }

    public String getDiagnosticReason() {
        return diagnosticReason;
    }
}
