package com.yuvan.busbooking.auth.totpalternative;

import com.yuvan.busbooking.auth.entity.TotpAlternativeType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry-style factory that resolves an {@link AlternativeOtpChannel} from
 * its {@link TotpAlternativeType}.
 *
 * <p>All {@link AlternativeOtpChannel} beans are injected and indexed by type.
 * Channels are auto-registered — adding a new bean automatically makes it
 * resolvable here.</p>
 */
@Service
public class AlternativeOtpChannelFactory {

    private final Map<TotpAlternativeType, AlternativeOtpChannel> channels;

    public AlternativeOtpChannelFactory(List<AlternativeOtpChannel> channelList) {
        this.channels = channelList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        AlternativeOtpChannel::getType,
                        Function.identity()
                ));
    }

    /**
     * Resolves the channel implementation for the given alternative method.
     *
     * @param type the desired alternative method.
     * @return the matching {@link AlternativeOtpChannel}.
     * @throws IllegalArgumentException if the type has no registered channel.
     */
    public AlternativeOtpChannel getChannel(TotpAlternativeType type) {
        AlternativeOtpChannel channel = channels.get(type);
        if (channel == null) {
            throw new IllegalArgumentException("Unsupported alternative method: " + type);
        }
        return channel;
    }
}