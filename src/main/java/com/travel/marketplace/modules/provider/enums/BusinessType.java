package com.travel.marketplace.modules.provider.enums;

/**
 * The category of service a provider offers.
 * Used to determine which detail entity and role to assign.
 */
public enum BusinessType {

    HOTEL,
    TOUR,
    RESTAURANT,
    VEHICLE,
    EXPERIENCE;

    /**
     * Returns the corresponding Spring Security role name.
     * e.g. HOTEL → "ROLE_PROVIDER_HOTEL"
     */
    public String toRoleName() {
        return "ROLE_PROVIDER_" + this.name();
    }
}
