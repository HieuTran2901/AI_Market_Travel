package com.travel.marketplace.modules.payment.momo;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class DefaultMomoClientTest {

    @Test
    void postsJsonAndParsesSuccessfulSandboxResponse() {
        MomoProperties properties = new MomoProperties();
        properties.setEndpoint("https://test-payment.momo.vn/v2/gateway/api/create");
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        DefaultMomoClient client = new DefaultMomoClient(properties, builder.build());
        MomoCreatePaymentRequest request = request();

        server.expect(requestTo(properties.getEndpoint()))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andRespond(withSuccess("""
                        {
                          "partnerCode":"MOMO",
                          "orderId":"MOMO_ORD_123",
                          "requestId":"MOMO_REQ_123",
                          "amount":150000,
                          "responseTime":1710000000000,
                          "message":"Successful.",
                          "resultCode":0,
                          "payUrl":"https://test-payment.momo.vn/v2/gateway/pay?t=abc"
                        }
                        """, MediaType.APPLICATION_JSON));

        MomoCreatePaymentResponse response = client.createPayment(request);

        assertThat(response.resultCode()).isZero();
        assertThat(response.payUrl()).startsWith("https://test-payment.momo.vn/");
        server.verify();
    }

    private MomoCreatePaymentRequest request() {
        return new MomoCreatePaymentRequest(
                "MOMO",
                "MOMO_REQ_123",
                150_000L,
                "MOMO_ORD_123",
                "pay with MoMo",
                "http://localhost:5173/payments/momo/return",
                "https://api.example.com/api/v1/payments/momo/ipn",
                "captureWallet",
                "",
                true,
                "en",
                "signature"
        );
    }
}
