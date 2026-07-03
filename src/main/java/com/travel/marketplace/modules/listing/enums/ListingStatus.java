package com.travel.marketplace.modules.listing.enums;

/**
 * Represents the lifecycle status of a marketplace listing.
 */
public enum ListingStatus {

    /** Created by provider but not yet submitted for review. */
    DRAFT,

    /** Submitted by provider, awaiting admin review. */
    PENDING_REVIEW,

    /** Approved by admin and visible to customers. */
    ACTIVE,

    /** Temporarily hidden by the provider. */
    INACTIVE,

    /** Rejected by admin during review. */
    REJECTED,

    /** Suspended by admin due to policy violations. */
    SUSPENDED,

    /** Soft-deleted or retired by the provider. */
    ARCHIVED
}
