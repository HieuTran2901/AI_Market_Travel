package com.travel.marketplace.modules.review.dto;

import com.travel.marketplace.modules.review.enums.TripType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ReviewCreateRequest {
    @NotNull(message = "Booking id is required")
    private Long bookingId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @Size(max = 150, message = "Title must be 150 characters or less")
    private String title;

    @NotBlank(message = "Comment is required")
    @Size(min = 10, max = 2000, message = "Comment must be between 10 and 2000 characters")
    private String comment;

    private TripType tripType;

    @Size(max = 6, message = "You can attach up to 6 review images")
    private List<@Size(max = 1000, message = "Image URL must be 1000 characters or less") String> imageUrls;
}
