package com.travel.marketplace.modules.notification.email;

public interface EmailProvider {
    EmailSendResult send(EmailMessage message);
    String getProviderName();
}
