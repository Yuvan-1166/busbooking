package com.yuvan.busbooking.payment.gateway;

import com.yuvan.busbooking.payment.entity.PaymentMethod;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentGatewayFactoryTest {

    private final PaymentGateway razorpayGateway = stub(PaymentMethod.RAZORPAY);
    private final PaymentGateway walletGateway = stub(PaymentMethod.WALLET);

    @Test
    void resolvesRegisteredGatewaysByMethod() {
        PaymentGatewayFactory factory =
                new PaymentGatewayFactory(List.of(razorpayGateway, walletGateway));

        assertThat(factory.getGateway(PaymentMethod.RAZORPAY)).isSameAs(razorpayGateway);
        assertThat(factory.getGateway(PaymentMethod.WALLET)).isSameAs(walletGateway);
    }

    @Test
    void throwsForUnsupportedMethod() {
        PaymentGatewayFactory factory =
                new PaymentGatewayFactory(List.of(walletGateway));

        assertThatThrownBy(() -> factory.getGateway(PaymentMethod.RAZORPAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Unsupported payment method: RAZORPAY");
    }

    @Test
    void rejectsDuplicatedMethodRegistrations() {
        assertThatThrownBy(() -> new PaymentGatewayFactory(
                List.of(razorpayGateway, stub(PaymentMethod.RAZORPAY))))
                .isInstanceOf(IllegalStateException.class);
    }

    private PaymentGateway stub(PaymentMethod method) {
        return new PaymentGateway() {
            @Override
            public PaymentMethod getMethod() {
                return method;
            }

            @Override
            public PaymentGatewayResult initiate(PaymentGatewayInitiateRequest request) {
                return PaymentGatewayResult.success("ok");
            }

            @Override
            public PaymentGatewayResult verify(PaymentGatewayVerifyRequest request) {
                return PaymentGatewayResult.success("ok");
            }

            @Override
            public PaymentGatewayResult refund(PaymentGatewayRefundRequest request) {
                return PaymentGatewayResult.success("ok");
            }
        };
    }
}