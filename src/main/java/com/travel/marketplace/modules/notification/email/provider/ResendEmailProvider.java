package com.travel.marketplace.modules.notification.email.provider;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.travel.marketplace.modules.notification.email.EmailMessage;
import com.travel.marketplace.modules.notification.email.EmailProvider;
import com.travel.marketplace.modules.notification.email.EmailSendResult;
import com.travel.marketplace.modules.notification.email.EmailSendResult.ErrorCategory;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ResendEmailProvider implements EmailProvider {

    private final String apiKey;
    private final String baseUrl;
    private final RestClient restClient;

    @Autowired
    public ResendEmailProvider(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.base-url:https://api.resend.com}") String baseUrl,
            @Value("${resend.timeout:10000}") int timeoutMs) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.baseUrl = baseUrl != null ? baseUrl.trim().replaceAll("/+$", "") : "https://api.resend.com";

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(timeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(this.baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    // Constructor for testing / injection
    public ResendEmailProvider(String apiKey, String baseUrl, RestClient restClient) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.baseUrl = baseUrl != null ? baseUrl.trim().replaceAll("/+$", "") : "https://api.resend.com";
        this.restClient = restClient;
    }

    @Override
    public String getProviderName() {
        return "RESEND";
    }

    @Override
    public EmailSendResult send(EmailMessage message) {
        if (apiKey.isBlank()) {
            log.warn("Resend API key is not configured. Marking for fallback.");
            return EmailSendResult.retryableFailure(
                    getProviderName(),
                    ErrorCategory.CONFIGURATION_ERROR,
                    "RESEND_API_KEY is not configured",
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

        ResendSendEmailRequest requestBody = ResendSendEmailRequest.builder()
                .from(message.getFrom())
                .to(Collections.singletonList(message.getTo().trim()))
                .subject(message.getSubject())
                .html(message.isHtml() ? message.getHtml() : null)
                .text(!message.isHtml() ? (message.getText() != null ? message.getText() : message.getHtml()) : null)
                .build();

        long startTime = System.currentTimeMillis();
        try {
            ResponseEntity<ResendSendEmailResponse> response = restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toEntity(ResendSendEmailResponse.class);

            long latency = System.currentTimeMillis() - startTime;

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String id = response.getBody().getId();
                log.info("EMAIL_SEND provider=RESEND result=SUCCESS messageId={} latency={}ms", id, latency);
                return EmailSendResult.success(getProviderName(), id);
            }

            return EmailSendResult.retryableFailure(
                    getProviderName(),
                    ErrorCategory.SERVER_ERROR,
                    "Unexpected HTTP status: " + response.getStatusCode(),
                    null
            );

        } catch (HttpClientErrorException e) {
            long latency = System.currentTimeMillis() - startTime;
            HttpStatusCode status = e.getStatusCode();

            if (status.value() == 429) {
                log.warn("EMAIL_SEND provider=RESEND result=FAILED error=RATE_LIMITED status=429 latency={}ms: {}", latency, e.getMessage());
                return EmailSendResult.retryableFailure(getProviderName(), ErrorCategory.RATE_LIMITED, "Resend rate limit exceeded (429)", e);
            } else if (status.value() == 400 || status.value() == 422) {
                log.error("EMAIL_SEND provider=RESEND result=FAILED error=CLIENT_ERROR status={} latency={}ms: {}", status.value(), latency, e.getResponseBodyAsString());
                return EmailSendResult.nonRetryableFailure(getProviderName(), ErrorCategory.CLIENT_ERROR, "Resend client error: " + e.getResponseBodyAsString(), e);
            } else if (status.value() == 401 || status.value() == 403) {
                log.warn("EMAIL_SEND provider=RESEND result=FAILED error=AUTH_ERROR status={} latency={}ms", status.value(), latency);
                return EmailSendResult.retryableFailure(getProviderName(), ErrorCategory.AUTH_ERROR, "Resend authentication failed: " + status.value(), e);
            } else {
                log.warn("EMAIL_SEND provider=RESEND result=FAILED error=CLIENT_ERROR status={} latency={}ms", status.value(), latency);
                return EmailSendResult.nonRetryableFailure(getProviderName(), ErrorCategory.CLIENT_ERROR, "Resend request error: " + e.getMessage(), e);
            }

        } catch (HttpServerErrorException e) {
            long latency = System.currentTimeMillis() - startTime;
            log.warn("EMAIL_SEND provider=RESEND result=FAILED error=SERVER_ERROR status={} latency={}ms", e.getStatusCode().value(), latency);
            return EmailSendResult.retryableFailure(getProviderName(), ErrorCategory.SERVER_ERROR, "Resend server error: " + e.getStatusCode().value(), e);

        } catch (ResourceAccessException e) {
            long latency = System.currentTimeMillis() - startTime;
            log.warn("EMAIL_SEND provider=RESEND result=FAILED error=TIMEOUT latency={}ms: {}", latency, e.getMessage());
            return EmailSendResult.retryableFailure(getProviderName(), ErrorCategory.TIMEOUT, "Resend connection or timeout error: " + e.getMessage(), e);

        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            log.error("EMAIL_SEND provider=RESEND result=FAILED error=UNKNOWN latency={}ms: {}", latency, e.getMessage());
            return EmailSendResult.retryableFailure(getProviderName(), ErrorCategory.UNKNOWN, "Unexpected Resend failure: " + e.getMessage(), e);
        }
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResendSendEmailRequest {
        private String from;
        private List<String> to;
        private String subject;
        private String html;
        private String text;
    }

    @Data
    public static class ResendSendEmailResponse {
        @JsonProperty("id")
        private String id;
    }
}
