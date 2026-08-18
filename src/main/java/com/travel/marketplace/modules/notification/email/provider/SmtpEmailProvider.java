package com.travel.marketplace.modules.notification.email.provider;

import com.travel.marketplace.modules.notification.email.EmailMessage;
import com.travel.marketplace.modules.notification.email.EmailProvider;
import com.travel.marketplace.modules.notification.email.EmailSendResult;
import com.travel.marketplace.modules.notification.email.EmailSendResult.ErrorCategory;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class SmtpEmailProvider implements EmailProvider {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@aitravelmarketplace.com}")
    private String defaultMailFrom;

    @Value("${app.mail.from-name:AI Travel Marketplace}")
    private String defaultMailFromName;

    public SmtpEmailProvider(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public String getProviderName() {
        return "SMTP";
    }

    @Override
    public EmailSendResult send(EmailMessage message) {
        if (mailSender == null) {
            log.warn("JavaMailSender bean is not available. SMTP sending skipped.");
            return EmailSendResult.retryableFailure(
                    getProviderName(),
                    ErrorCategory.CONFIGURATION_ERROR,
                    "JavaMailSender is not configured",
                    null
            );
        }

        if (message == null || message.getTo() == null || message.getTo().isBlank()) {
            return EmailSendResult.nonRetryableFailure(
                    getProviderName(),
                    ErrorCategory.CLIENT_ERROR,
                    "Recipient email ('to') is required",
                    null
            );
        }

        long startTime = System.currentTimeMillis();
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            String fromAddress = message.getFrom() != null && !message.getFrom().isBlank()
                    ? message.getFrom()
                    : defaultMailFrom;

            if (fromAddress.contains("<") && fromAddress.contains(">")) {
                helper.setFrom(fromAddress);
            } else {
                helper.setFrom(new InternetAddress(fromAddress, defaultMailFromName, StandardCharsets.UTF_8.name()));
            }

            helper.setTo(message.getTo().trim());
            helper.setSubject(message.getSubject() != null ? message.getSubject() : "AI Travel Notification");

            String content = message.getHtml() != null ? message.getHtml() : (message.getText() != null ? message.getText() : "");
            helper.setText(content, message.isHtml());

            mailSender.send(mimeMessage);
            long latency = System.currentTimeMillis() - startTime;

            log.info("EMAIL_SEND provider=SMTP result=SUCCESS latency={}ms", latency);
            return EmailSendResult.success(getProviderName(), "smtp-" + System.currentTimeMillis());

        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            long latency = System.currentTimeMillis() - startTime;
            log.error("EMAIL_SEND provider=SMTP result=FAILED error=SERVER_ERROR latency={}ms: {}", latency, e.getMessage());
            return EmailSendResult.retryableFailure(getProviderName(), ErrorCategory.SERVER_ERROR, "SMTP send failed: " + e.getMessage(), e);
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            log.error("EMAIL_SEND provider=SMTP result=FAILED error=UNKNOWN latency={}ms: {}", latency, e.getMessage());
            return EmailSendResult.retryableFailure(getProviderName(), ErrorCategory.UNKNOWN, "Unexpected SMTP error: " + e.getMessage(), e);
        }
    }
}
