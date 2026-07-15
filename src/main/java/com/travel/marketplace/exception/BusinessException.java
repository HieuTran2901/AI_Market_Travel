package com.travel.marketplace.exception;

public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;
    private final org.springframework.http.HttpStatus status;
    private final java.util.Map<String, Object> details;

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.status = null;
        this.details = null;
    }

    public BusinessException(ErrorCode errorCode, String message, org.springframework.http.HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
        this.details = null;
    }

    public BusinessException(
            ErrorCode errorCode,
            String message,
            org.springframework.http.HttpStatus status,
            java.util.Map<String, Object> details
    ) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
        this.details = details;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public org.springframework.http.HttpStatus getStatus() {
        return status;
    }

    public java.util.Map<String, Object> getDetails() {
        return details;
    }
}
