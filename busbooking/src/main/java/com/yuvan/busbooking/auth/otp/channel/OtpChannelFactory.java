package com.yuvan.busbooking.auth.otp.channel;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry-style factory that resolves an {@link OtpChannel} from its
 * {@link OtpChannelType}.
 *
 * <p>All {@link OtpChannel} beans are injected and indexed by type. Channels
 * are auto-registered — adding a new bean automatically makes it resolvable
 * here, which is what keeps the OTP flow single: the controller and the
 * service never reference a concrete delivery method.</p>
 */
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

    /**
     * Resolves the channel implementation for the given delivery method.
     *
     * @param type the desired delivery method.
     * @return the matching {@link OtpChannel}.
     * @throws IllegalArgumentException if the type has no registered channel.
     */
    public OtpChannel getChannel(OtpChannelType type) {
        OtpChannel channel = channels.get(type);
        if (channel == null) {
            throw new IllegalArgumentException("Unsupported OTP channel: " + type);
        }
        return channel;
    }
}
