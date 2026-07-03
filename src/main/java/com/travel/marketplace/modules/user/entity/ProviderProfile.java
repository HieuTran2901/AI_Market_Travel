package com.travel.marketplace.modules.user.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.travel.marketplace.modules.provider.enums.BusinessType;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Provider business profile linked to a User account.
 *
 * Soft-delete: records with deleted_at != NULL are excluded from all queries
 * via the @SQLRestriction annotation (Hibernate 6+).
 *
 * Phase 3 extension: listings will FK → provider_profiles.id.
 */
@Entity
@Table(name = "provider_profiles")
@SQLRestriction("deleted_at IS NULL")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "user")
@EqualsAndHashCode(exclude = "user")
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Owning User ──────────────────────────────────────────────
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    // ── Business Identity ─────────────────────────────────────────
    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", nullable = false, length = 20)
    private BusinessType businessType;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ── Location ──────────────────────────────────────────────────
    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String city = "";

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String country = "Vietnam";

    // ── Contact ───────────────────────────────────────────────────
    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String website;

    // ── Tax & Banking ─────────────────────────────────────────────
    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_account_name", length = 100)
    private String bankAccountName;

    // ── Verification ─────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // ── Audit & Soft Delete ───────────────────────────────────────
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ── Domain Helpers ────────────────────────────────────────────

    public boolean isApproved() {
        return VerificationStatus.APPROVED.equals(this.verificationStatus);
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}
