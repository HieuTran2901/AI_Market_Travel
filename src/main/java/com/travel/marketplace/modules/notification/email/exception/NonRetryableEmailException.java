package com.travel.marketplace.modules.notification.email.exception;

public class NonRetryableEmailException extends EmailSendException {
    public NonRetryableEmailException(String message) {
        super(message);
    }

    public NonRetryableEmailException(String message, Throwable cause) {
        super(message, cause);
    }
}
