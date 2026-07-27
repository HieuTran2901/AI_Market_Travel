package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.payment.dto.AiCoinPaymentRequest;
import com.travel.marketplace.modules.payment.dto.AiCoinPaymentResponse;
import com.travel.marketplace.modules.payment.entity.AiCoinPurchase;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.gateway.GatewayResponse;
import com.travel.marketplace.modules.payment.gateway.PaymentGateway;
import com.travel.marketplace.modules.payment.gateway.PaymentGatewayFactory;
import com.travel.marketplace.modules.payment.repository.AiCoinPurchaseRepository;
import com.travel.marketplace.modules.payment.repository.PaymentRepository;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.travel.marketplace.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiCoinPaymentServiceTest {

    @Mock
    private AiCoinPurchaseRepository aiCoinPurchaseRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaymentGatewayFactory paymentGatewayFactory;
    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private AiCoinWalletService aiCoinWalletService;

    @InjectMocks
    private AiCoinPaymentService aiCoinPaymentService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
    }

    @Test
    void testAiCoinPurchaseWithMomo_ShouldWork() {
        // Arrange
        AiCoinPaymentRequest request = new AiCoinPaymentRequest();
        request.setPaymentMethod(PaymentMethod.MOMO);
        request.setPackageId("starter");
        
        Payment savedPayment = new Payment();
        savedPayment.setId(10L);
        savedPayment.setStatus(PaymentStatus.PENDING);
        
        AiCoinPurchase savedPurchase = new AiCoinPurchase();
        savedPurchase.setId(100L);
        savedPurchase.setStatus(com.travel.marketplace.modules.payment.enums.AiCoinPurchaseStatus.PAYMENT_PENDING);
        
        when(paymentRepository.saveAndFlush(any(Payment.class))).thenReturn(savedPayment);
        when(aiCoinPurchaseRepository.save(any(AiCoinPurchase.class))).thenReturn(savedPurchase);
        
        PaymentGateway momoGateway = mock(PaymentGateway.class);
        when(paymentGatewayFactory.getGateway(PaymentMethod.MOMO)).thenReturn(momoGateway);
        
        GatewayResponse gatewayResponse = new GatewayResponse();
        gatewayResponse.setRawResponse(Map.of("payUrl", "https://momo.vn/pay"));
        when(momoGateway.processPayment(any(Payment.class))).thenReturn(gatewayResponse);

        // Act
        AiCoinPaymentResponse response = aiCoinPaymentService.createPayment(1L, request);

        // Assert
        assertThat(response.getPaymentUrl()).isEqualTo("https://momo.vn/pay");
        verify(paymentGatewayFactory).getGateway(PaymentMethod.MOMO);
    }

    @Test
    void testAiCoinPurchaseWithBankTransfer_ShouldRouteToSepay() {
        // Arrange
        AiCoinPaymentRequest request = new AiCoinPaymentRequest();
        request.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        request.setPackageId("explorer");
        
        Payment savedPayment = new Payment();
        savedPayment.setId(11L);
        savedPayment.setStatus(PaymentStatus.PENDING);
        
        AiCoinPurchase savedPurchase = new AiCoinPurchase();
        savedPurchase.setId(101L);
        savedPurchase.setStatus(com.travel.marketplace.modules.payment.enums.AiCoinPurchaseStatus.PAYMENT_PENDING);
        
        when(paymentRepository.saveAndFlush(any(Payment.class))).thenReturn(savedPayment);
        when(aiCoinPurchaseRepository.save(any(AiCoinPurchase.class))).thenReturn(savedPurchase);
        
        PaymentGateway sepayGateway = mock(PaymentGateway.class);
        when(paymentGatewayFactory.getGateway(PaymentMethod.BANK_TRANSFER)).thenReturn(sepayGateway);
        
        GatewayResponse gatewayResponse = new GatewayResponse();
        gatewayResponse.setRawResponse(Map.of("checkoutUrl", "https://pay.sepay.vn/checkout", "checkoutFields", Map.of()));
        when(sepayGateway.processPayment(any(Payment.class))).thenReturn(gatewayResponse);

        // Act
        AiCoinPaymentResponse response = aiCoinPaymentService.createPayment(1L, request);

        // Assert
        assertThat(response.getCheckoutUrl()).isEqualTo("https://pay.sepay.vn/checkout");
        verify(paymentGatewayFactory).getGateway(PaymentMethod.BANK_TRANSFER);
        verify(aiCoinPurchaseRepository, times(2)).save(any(AiCoinPurchase.class));
        verify(paymentRepository).saveAndFlush(any(Payment.class));
    }

    @Test
    void testAiCoinPurchaseWithUnsupportedMethod_ShouldThrowException() {
        // Arrange
        AiCoinPaymentRequest request = new AiCoinPaymentRequest();
        request.setPaymentMethod(PaymentMethod.VNPAY);
        request.setPackageId("starter");

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            aiCoinPaymentService.createPayment(1L, request);
        });

        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
        assertThat(exception.getMessage()).contains("Payment method not supported for AI Coin purchases");
        verify(paymentRepository, never()).save(any());
        verify(paymentGatewayFactory, never()).getGateway(any());
    }

    @Test
    void successfulStatusUpdateCreditsWalletOnceAndMarksPurchaseCredited() {
        Payment payment = new Payment();
        payment.setId(77L);
        payment.setStatus(PaymentStatus.PROCESSING);
        payment.setReferenceId(101L);

        AiCoinPurchase purchase = new AiCoinPurchase();
        purchase.setId(101L);
        purchase.setUserId(1L);
        purchase.setBaseCoins(500);
        purchase.setBonusCoins(75);
        purchase.setTotalCoins(575);
        purchase.setStatus(com.travel.marketplace.modules.payment.enums.AiCoinPurchaseStatus.PAYMENT_PENDING);

        when(paymentRepository.findById(77L)).thenReturn(Optional.of(payment));
        when(aiCoinPurchaseRepository.findById(101L)).thenReturn(Optional.of(purchase));

        aiCoinPaymentService.handlePaymentStatusUpdate(77L, PaymentStatus.SUCCESS);

        verify(aiCoinWalletService).creditPurchase(
                1L,
                77L,
                101L,
                500,
                75,
                "AI_COIN_PURCHASE:77"
        );
        assertThat(purchase.getStatus()).isEqualTo(com.travel.marketplace.modules.payment.enums.AiCoinPurchaseStatus.CREDITED);
        verify(aiCoinPurchaseRepository).save(purchase);
    }

    @Test
    void successfulStatusRetryCreditsUncreditedPurchase() {
        Payment payment = new Payment();
        payment.setId(78L);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setReferenceId(102L);

        AiCoinPurchase purchase = new AiCoinPurchase();
        purchase.setId(102L);
        purchase.setUserId(1L);
        purchase.setBaseCoins(1000);
        purchase.setBonusCoins(150);
        purchase.setTotalCoins(1150);
        purchase.setStatus(com.travel.marketplace.modules.payment.enums.AiCoinPurchaseStatus.PAYMENT_PENDING);

        when(paymentRepository.findById(78L)).thenReturn(Optional.of(payment));
        when(aiCoinPurchaseRepository.findById(102L)).thenReturn(Optional.of(purchase));

        aiCoinPaymentService.handlePaymentStatusUpdate(78L, PaymentStatus.SUCCESS);

        verify(aiCoinWalletService).creditPurchase(
                1L,
                78L,
                102L,
                1000,
                150,
                "AI_COIN_PURCHASE:78"
        );
        assertThat(purchase.getStatus()).isEqualTo(com.travel.marketplace.modules.payment.enums.AiCoinPurchaseStatus.CREDITED);
        verify(paymentRepository, never()).save(payment);
    }
}
