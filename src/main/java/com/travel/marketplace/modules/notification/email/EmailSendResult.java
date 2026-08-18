package com.travel.marketplace.modules.notification.email;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailSendResult {
    private boolean success;
    private String provider;
    private String messageId;
    private ErrorCategory errorCategory;
    private boolean retryable;
    private String errorMessage;
    private Throwable cause;

    public enum ErrorCategory {
        NONE,
        TIMEOUT,
        RATE_LIMITED,
        SERVER_ERROR,
        CLIENT_ERROR,
        NETWORK_ERROR,
        AUTH_ERROR,
        CONFIGURATION_ERROR,
        UNKNOWN
    }

    public static EmailSendResult success(String provider, String messageId) {
        return EmailSendResult.builder()
                .success(true)
                .provider(provider)
                .messageId(messageId)
                .errorCategory(ErrorCategory.NONE)
                .retryable(false)
                .build();
    }

    public static EmailSendResult retryableFailure(String provider, ErrorCategory category, String message, Throwable cause) {
        return EmailSendResult.builder()
                .success(false)
                .provider(provider)
                .errorCategory(category)
                .retryable(true)
                .errorMessage(message)
                .cause(cause)
                .build();
    }

    public static EmailSendResult nonRetryableFailure(String provider, ErrorCategory category, String message, Throwable cause) {
        return EmailSendResult.builder()
                .success(false)
                .provider(provider)
                .errorCategory(category)
                .retryable(false)
                .errorMessage(message)
                .cause(cause)
                .build();
    }
}
