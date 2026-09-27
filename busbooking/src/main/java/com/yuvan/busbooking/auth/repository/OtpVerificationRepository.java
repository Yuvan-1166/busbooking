package com.yuvan.busbooking.auth.repository;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.entity.OtpVerification;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository
        extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification>
    findTopByTargetAndChannelAndPurposeOrderByCreatedAtDesc(
            String target,
            OtpChannelType channel,
            OtpPurpose purpose
    );

    void deleteByTargetAndChannelAndPurpose(
            String target,
            OtpChannelType channel,
            OtpPurpose purpose
    );

}
