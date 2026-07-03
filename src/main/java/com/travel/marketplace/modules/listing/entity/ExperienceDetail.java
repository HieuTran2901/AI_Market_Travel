package com.travel.marketplace.modules.listing.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Hub entity for Experience listings.
 * Connects the base Listing with experience-specific properties.
 * Phase 3 will attach ExperienceSessions to this entity.
 */
@Entity
@Table(name = "experience_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "listing")
@EqualsAndHashCode(exclude = "listing")
public class ExperienceDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    @JsonIgnore
    private Listing listing;

    @Column(name = "duration_hours", precision = 5, scale = 1)
    private BigDecimal durationHours;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "min_participants", nullable = false)
    @Builder.Default
    private Integer minParticipants = 1;

    @Column(name = "skill_level", nullable = false, length = 20)
    @Builder.Default
    private String skillLevel = "ALL"; // BEGINNER, INTERMEDIATE, ADVANCED, ALL

    @Column(columnDefinition = "TEXT")
    private String includes;

    @Column(name = "what_to_bring", columnDefinition = "TEXT")
    private String whatToBring;

    @Column(name = "meeting_point", length = 500)
    private String meetingPoint;
}
