package com.travel.marketplace.modules.provider.enums;

/**
 * Verification lifecycle for a Provider's business profile.
 *
 * Transitions:
 *   PENDING → APPROVED  (Admin approves)
 *   PENDING → REJECTED  (Admin rejects with reason)
 *   APPROVED → SUSPENDED (Admin temporarily disables)
 *   SUSPENDED → APPROVED (Admin re-activates)
 *   REJECTED → PENDING   (Provider re-submits — future workflow)
 */
public enum VerificationStatus {

    /** Awaiting Admin review after provider registration. */
    PENDING,

    /** Admin has verified and approved the business. Provider may publish listings. */
    APPROVED,

    /** Admin rejected the application. Rejection reason must be provided. */
    REJECTED,

    /** Provider is temporarily suspended by Admin. Listings remain but are hidden. */
    SUSPENDED
}
