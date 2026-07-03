package com.travel.marketplace.modules.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReviewReplyRequest {
    @NotBlank(message = "Reply text is required")
    @Size(min = 2, max = 1500, message = "Reply text must be between 2 and 1500 characters")
    private String replyText;
}
