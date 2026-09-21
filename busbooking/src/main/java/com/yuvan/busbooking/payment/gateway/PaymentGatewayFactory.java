package com.yuvan.busbooking.payment.gateway;

import com.yuvan.busbooking.payment.entity.PaymentMethod;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry-style factory that resolves a {@link PaymentGateway} from its
 * {@link PaymentMethod}.
 *
 * <p>All {@link PaymentGateway} beans are injected and indexed by method.
 * Gateways are auto-registered — adding a new bean automatically makes it
 * resolvable here without touching the factory, service or controller.</p>
 */
@Service
public class PaymentGatewayFactory {

    private final Map<PaymentMethod, PaymentGateway> gateways;

    public PaymentGatewayFactory(List<PaymentGateway> gatewayList) {
        this.gateways = gatewayList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        PaymentGateway::getMethod,
                        Function.identity()
                ));
    }

    /**
     * Resolves the gateway implementation for the given payment method.
     *
     * @param method the desired payment method.
     * @return the matching {@link PaymentGateway}.
     * @throws IllegalArgumentException if the method has no registered gateway.
     */
    public PaymentGateway getGateway(PaymentMethod method) {
        PaymentGateway gateway = gateways.get(method);
        if (gateway == null) {
            throw new IllegalArgumentException("Unsupported payment method: " + method);
        }
        return gateway;
    }
}