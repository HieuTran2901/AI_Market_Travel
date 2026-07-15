package com.travel.marketplace.exception;

public enum ErrorCode {
    SUCCESS("SUCCESS", "Operation completed successfully"),
    UNAUTHORIZED("UNAUTHORIZED", "Full authentication is required to access this resource"),
    FORBIDDEN("FORBIDDEN", "You do not have permission to access this resource"),
    VALIDATION_FAILED("VALIDATION_FAILED", "Validation failed for one or more fields"),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "Requested resource was not found"),
    BAD_REQUEST("BAD_REQUEST", "Bad request format or parameters"),
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", "An unexpected error occurred on the server"),
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Email address is already registered"),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Invalid email or password"),
    ACCOUNT_BANNED("ACCOUNT_BANNED", "Your account has been banned"),
    ACCOUNT_INACTIVE("ACCOUNT_INACTIVE", "Your account is currently inactive"),
    ACCOUNT_LOCKED("ACCOUNT_LOCKED", "Your account is temporarily locked"),
    ACCOUNT_EXPIRED("ACCOUNT_EXPIRED", "Your account has expired"),
    CREDENTIALS_EXPIRED("CREDENTIALS_EXPIRED", "Your credentials have expired"),
    TOKEN_EXPIRED("TOKEN_EXPIRED", "The provided authentication token has expired"),
    TOKEN_INVALID("TOKEN_INVALID", "The provided authentication token is invalid or malformed"),
    INVENTORY_NOT_AVAILABLE("INVENTORY_NOT_AVAILABLE", "Requested inventory is not available"),
    RESERVATION_EXPIRED("RESERVATION_EXPIRED", "The reservation lock has expired"),
    ORDER_NOT_FOUND("ORDER_NOT_FOUND", "The requested order was not found"),
    BOOKING_NOT_FOUND("BOOKING_NOT_FOUND", "The requested booking was not found"),
    REVIEW_NOT_FOUND("REVIEW_NOT_FOUND", "The requested review was not found"),
    REVIEW_NOT_ALLOWED("REVIEW_NOT_ALLOWED", "You are not allowed to perform this review action"),
    REVIEW_ALREADY_EXISTS("REVIEW_ALREADY_EXISTS", "A review already exists for this booking"),
    REVIEW_BOOKING_REQUIRED("REVIEW_BOOKING_REQUIRED", "A completed or confirmed booking is required to review this listing"),
    REVIEW_INVALID_RATING("REVIEW_INVALID_RATING", "Review rating must be between 1 and 5"),
    REVIEW_ACCESS_DENIED("REVIEW_ACCESS_DENIED", "You do not have access to this review"),
    USER_NOT_FOUND("USER_NOT_FOUND", "The requested user was not found"),
    USER_ALREADY_BANNED("USER_ALREADY_BANNED", "The user is already banned"),
    USER_NOT_BANNED("USER_NOT_BANNED", "The user is not banned"),
    CANNOT_BAN_SELF("CANNOT_BAN_SELF", "You cannot ban your own account"),
    CANNOT_BAN_LAST_ADMIN("CANNOT_BAN_LAST_ADMIN", "You cannot ban the last active admin account"),
    INVALID_USER_STATUS_TRANSITION("INVALID_USER_STATUS_TRANSITION", "The requested user status transition is invalid"),
    BAN_REASON_REQUIRED("BAN_REASON_REQUIRED", "A ban reason is required");

    private final String code;
    private final String defaultMessage;

    ErrorCode(String code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
