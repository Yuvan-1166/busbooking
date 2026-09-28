package com.yuvan.busbooking.auth.otp.channel;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OtpChannelFactory {

    private final Map<OtpChannelType, OtpChannel> channels;

    public OtpChannelFactory(List<OtpChannel> channelList) {
        this.channels = channelList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        OtpChannel::getType,
                        Function.identity()
                ));
    }

    public OtpChannel getChannel(OtpChannelType type) {
        OtpChannel channel = channels.get(type);
        if (channel == null) {
            throw new IllegalArgumentException("Unsupported OTP channel: " + type);
        }
        return channel;
    }
}
