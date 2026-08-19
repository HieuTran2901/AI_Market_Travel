package com.travel.marketplace.modules.notification.email;

import com.travel.marketplace.modules.notification.email.provider.ResendEmailProvider;
import com.travel.marketplace.modules.notification.email.provider.SmtpEmailProvider;
import com.travel.marketplace.modules.notification.service.EmailNotificationChannel;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {
        ResendEmailProvider.class,
        SmtpEmailProvider.class,
        FallbackEmailService.class,
        EmailNotificationChannel.class
})
@TestPropertySource(properties = {
        "resend.api-key=re_test_dummy_key",
        "resend.base-url=https://api.resend.com",
        "resend.timeout=10000",
        "app.email.provider=resend",
        "app.email.from=AI Travel Marketplace <onboarding@resend.dev>",
        "app.email.fallback-enabled=true",
        "app.mail.from=noreply@aitravelmarketplace.com",
        "app.mail.from-name=AI Travel Marketplace"
})
class EmailContextIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private ResendEmailProvider resendEmailProvider;

    @Autowired
    private SmtpEmailProvider smtpEmailProvider;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailNotificationChannel emailNotificationChannel;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JavaMailSender javaMailSender;

    @Test
    @DisplayName("Verify that ResendEmailProvider and all email beans are created and wired into ApplicationContext without constructor failure")
    void testEmailBeansInstantiationAndContextLoading() {
        assertThat(applicationContext).isNotNull();
        assertThat(resendEmailProvider).isNotNull();
        assertThat(smtpEmailProvider).isNotNull();
        assertThat(emailService).isNotNull();
        assertThat(emailNotificationChannel).isNotNull();

        assertThat(emailService).isInstanceOf(FallbackEmailService.class);
        assertThat(resendEmailProvider.getProviderName()).isEqualTo("RESEND");
        assertThat(smtpEmailProvider.getProviderName()).isEqualTo("SMTP");
    }
}
