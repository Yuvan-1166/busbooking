package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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

    public OtpFlow getFlow(OtpPurpose purpose) {
        OtpFlow flow = flows.get(purpose);
        if (flow == null) {
            throw new IllegalArgumentException("Unsupported OTP purpose: " + purpose);
        }
        return flow;
    }
}