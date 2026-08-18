package com.travel.marketplace.modules.notification.email;

import com.travel.marketplace.modules.notification.email.exception.EmailSendException;
import com.travel.marketplace.modules.notification.email.exception.NonRetryableEmailException;
import com.travel.marketplace.modules.notification.email.provider.ResendEmailProvider;
import com.travel.marketplace.modules.notification.email.provider.SmtpEmailProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class FallbackEmailService implements EmailService {

    private final ResendEmailProvider resendProvider;
    private final SmtpEmailProvider smtpProvider;

    @Value("${app.email.provider:resend}")
    private String configuredProvider;

    @Value("${app.email.from:AI Travel Marketplace <onboarding@resend.dev>}")
    private String defaultEmailFrom;

    @Value("${app.email.fallback-enabled:true}")
    private boolean fallbackEnabled;

    public FallbackEmailService(ResendEmailProvider resendProvider, SmtpEmailProvider smtpProvider) {
        this.resendProvider = resendProvider;
        this.smtpProvider = smtpProvider;
    }

    // Setters for test convenience
    public void setConfiguredProvider(String configuredProvider) {
        this.configuredProvider = configuredProvider;
    }

    public void setDefaultEmailFrom(String defaultEmailFrom) {
        this.defaultEmailFrom = defaultEmailFrom;
    }

    public void setFallbackEnabled(boolean fallbackEnabled) {
        this.fallbackEnabled = fallbackEnabled;
    }

    @Override
    public void send(EmailMessage message) {
        if (message == null) {
            throw new NonRetryableEmailException("EmailMessage cannot be null");
        }

        if (message.getEventId() == null || message.getEventId().isBlank()) {
            message.setEventId(UUID.randomUUID().toString());
        }

        if (message.getFrom() == null || message.getFrom().isBlank()) {
            message.setFrom(defaultEmailFrom);
        }

        String targetDomain = extractDomain(message.getTo());

        // Direct SMTP mode if configured explicitly
        if ("smtp".equalsIgnoreCase(configuredProvider)) {
            EmailSendResult smtpResult = smtpProvider.send(message);
            if (!smtpResult.isSuccess()) {
                throw new EmailSendException("SMTP email dispatch failed: " + smtpResult.getErrorMessage(), smtpResult.getCause());
            }
            return;
        }

        // Primary: Resend Email Provider
        EmailSendResult resendResult = resendProvider.send(message);
        if (resendResult.isSuccess()) {
            return;
        }

        // Check if error is permanent (non-retryable, e.g. 400 Bad Request, malformed email)
        if (!resendResult.isRetryable()) {
            log.error("Non-retryable email error from Resend for domain: {}. Not falling back to SMTP. Error: {}",
                    targetDomain, resendResult.getErrorMessage());
            throw new NonRetryableEmailException("Resend client error: " + resendResult.getErrorMessage(), resendResult.getCause());
        }

        // Check if fallback is disabled
        if (!fallbackEnabled) {
            log.error("Resend delivery failed and fallback is disabled for domain: {}. Error: {}",
                    targetDomain, resendResult.getErrorMessage());
            throw new EmailSendException("Resend delivery failed and fallback is disabled: " + resendResult.getErrorMessage(), resendResult.getCause());
        }

        // Execute fallback: SMTP
        log.warn("Falling back to SMTP for domain: {} due to Resend failure ({})", targetDomain, resendResult.getErrorCategory());
        EmailSendResult smtpResult = smtpProvider.send(message);

        if (smtpResult.isSuccess()) {
            log.info("EMAIL_SEND provider=SMTP result=SUCCESS fallback=true eventId={}", message.getEventId());
            return;
        }

        log.error("Both Resend and SMTP fallback failed for domain: {}. Resend error: {}, SMTP error: {}",
                targetDomain, resendResult.getErrorMessage(), smtpResult.getErrorMessage());
        throw new EmailSendException("Both email providers failed. Resend: [" + resendResult.getErrorMessage() +
                "], SMTP: [" + smtpResult.getErrorMessage() + "]", smtpResult.getCause());
    }

    private String extractDomain(String email) {
        if (email == null || !email.contains("@")) {
            return "unknown";
        }
        return email.substring(email.indexOf("@"));
    }
}
