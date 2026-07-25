package com.travel.marketplace.modules.payment.momo;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

@Component
@ConditionalOnProperty(prefix = "payment.momo", name = "enabled", havingValue = "true")
public class DefaultMomoClient implements MomoClient {

    private final MomoProperties properties;
    private final RestClient restClient;

    @Autowired
    public DefaultMomoClient(MomoProperties properties, RestClient.Builder builder) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.getTimeout());
        requestFactory.setReadTimeout(properties.getTimeout());
        this.restClient = builder.requestFactory(requestFactory).build();
    }

    DefaultMomoClient(MomoProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    @Override
    public MomoCreatePaymentResponse createPayment(MomoCreatePaymentRequest request) {
        return restClient.post()
                .uri(properties.getEndpoint())
                .contentType(new MediaType("application", "json", StandardCharsets.UTF_8))
                .accept(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(MomoCreatePaymentResponse.class);
    }
}
