package com.yuvan.busbooking.payment.gateway.wallet;

import com.yuvan.busbooking.payment.entity.PaymentMethod;
import com.yuvan.busbooking.payment.gateway.PaymentGateway;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayInitiateRequest;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayRefundRequest;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayResult;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayVerifyRequest;
import com.yuvan.busbooking.wallet.service.WalletService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

/**
 * {@link PaymentGateway} settled against the user's in-app wallet balance.
 *
 * <p>The wallet needs no external setup, so {@link #initiate} is a no-op; the
 * money moves only when {@link #verify} deducts the balance. Refunds credit the
 * wallet back.</p>
 */
@Service
public class WalletPaymentGateway implements PaymentGateway {

    private final WalletService walletService;

    public WalletPaymentGateway(WalletService walletService) {
        this.walletService = walletService;
    }

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.WALLET;
    }

    @Override
    public PaymentGatewayResult initiate(PaymentGatewayInitiateRequest request) {
        return PaymentGatewayResult.success("Wallet payment ready for confirmation");
    }

    @Override
    public PaymentGatewayResult verify(PaymentGatewayVerifyRequest request) {
        if (request.userId() == null) {
            return PaymentGatewayResult.failure("Missing user for wallet payment");
        }

        try {
            BigDecimal balanceAfter = walletService.deduct(
                    request.userId(),
                    request.amount()
            );
            return PaymentGatewayResult.success(
                    "Wallet payment completed",
                    Map.of(METADATA_WALLET_BALANCE, balanceAfter.toPlainString())
            );
        } catch (IllegalArgumentException e) {
            return PaymentGatewayResult.failure(e.getMessage());
        }
    }

    @Override
    public PaymentGatewayResult refund(PaymentGatewayRefundRequest request) {
        if (request.userId() == null) {
            return PaymentGatewayResult.failure("Missing user for wallet refund");
        }

        walletService.refund(request.userId(), request.amount());
        return PaymentGatewayResult.success("Wallet refunded");
    }
}