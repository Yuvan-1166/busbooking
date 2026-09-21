package com.yuvan.busbooking.payment.gateway.wallet;

import com.yuvan.busbooking.payment.gateway.PaymentGatewayInitiateRequest;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayRefundRequest;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayResult;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayVerifyRequest;
import com.yuvan.busbooking.wallet.service.WalletService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static com.yuvan.busbooking.payment.gateway.PaymentGateway.METADATA_WALLET_BALANCE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletPaymentGatewayTest {

    private static final long USER_ID = 42L;
    private static final BigDecimal AMOUNT = new BigDecimal("250.00");

    @Mock
    private WalletService walletService;

    @InjectMocks
    private WalletPaymentGateway gateway;

    @Test
    void initiateAlwaysSucceeds() {
        PaymentGatewayResult result = gateway.initiate(
                new PaymentGatewayInitiateRequest("TXN-123", AMOUNT));

        assertThat(result.successful()).isTrue();
    }

    @Test
    void verifyDeductsBalanceAndExposesRemainingBalance() {
        when(walletService.deduct(USER_ID, AMOUNT)).thenReturn(new BigDecimal("900.00"));

        PaymentGatewayResult result = gateway.verify(
                new PaymentGatewayVerifyRequest(USER_ID, AMOUNT));

        assertThat(result.successful()).isTrue();
        assertThat(result.metadata()).containsEntry(METADATA_WALLET_BALANCE, "900.00");
    }

    @Test
    void verifySurfacesInsufficientBalanceAsFailure() {
        when(walletService.deduct(USER_ID, AMOUNT))
                .thenThrow(new IllegalArgumentException("Insufficient wallet balance"));

        PaymentGatewayResult result = gateway.verify(
                new PaymentGatewayVerifyRequest(USER_ID, AMOUNT));

        assertThat(result.successful()).isFalse();
        assertThat(result.message()).contains("Insufficient wallet balance");
    }

    @Test
    void refundCreditsWallet() {
        PaymentGatewayResult result = gateway.refund(
                new PaymentGatewayRefundRequest(null, AMOUNT, USER_ID));

        assertThat(result.successful()).isTrue();
        verify(walletService).refund(eq(USER_ID), eq(AMOUNT));
    }

    @Test
    void rejectsRequestsWithoutUser() {
        assertThat(gateway.verify(new PaymentGatewayVerifyRequest(null, AMOUNT))
                .successful()).isFalse();
        assertThat(gateway.refund(new PaymentGatewayRefundRequest(null, AMOUNT, null))
                .successful()).isFalse();
        verify(walletService, org.mockito.Mockito.never()).deduct(any(), any());
    }
}