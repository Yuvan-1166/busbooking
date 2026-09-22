package com.yuvan.busbooking.auth.otp;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry-style factory that resolves an {@link OtpFlow} from its
 * {@link OtpPurpose}.
 *
 * <p>All {@link OtpFlow} beans are injected and indexed by purpose. Flows are
 * auto-registered — adding a new bean automatically makes it resolvable
 * here.</p>
 */
@Service
public class OtpFlowFactory {

    private final Map<OtpPurpose, OtpFlow> flows;

    public OtpFlowFactory(List<OtpFlow> flowList) {
        this.flows = flowList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        OtpFlow::getPurpose,
                        Function.identity()
                ));
    }

    /**
     * Resolves the flow implementation for the given purpose.
     *
     * @param purpose the desired purpose.
     * @return the matching {@link OtpFlow}.
     * @throws IllegalArgumentException if the purpose has no registered flow.
     */
    public OtpFlow getFlow(OtpPurpose purpose) {
        OtpFlow flow = flows.get(purpose);
        if (flow == null) {
            throw new IllegalArgumentException("Unsupported OTP purpose: " + purpose);
        }
        return flow;
    }
}