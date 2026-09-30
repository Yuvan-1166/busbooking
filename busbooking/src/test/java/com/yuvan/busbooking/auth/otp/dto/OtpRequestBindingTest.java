package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The unified endpoints replaced per-channel payloads, so the request records
 * have to keep reading the old field names while accepting the new ones.
 */
class OtpRequestBindingTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void readsLegacyEmailPayloadOnSend() throws Exception {
        SendOtpRequest request = objectMapper.readValue(
                "{\"email\":\"rider@example.com\"}", SendOtpRequest.class);

        assertThat(request.target()).isEqualTo("rider@example.com");
        assertThat(request.resolvedChannel()).isEqualTo(OtpChannelType.EMAIL);
        assertThat(request.resolvedPurpose()).isEqualTo(OtpPurpose.REGISTRATION);
    }

    @Test
    void readsMobilePayloadOnSend() throws Exception {
        SendOtpRequest request = objectMapper.readValue(
                "{\"mobileNumber\":\"9876543210\",\"channel\":\"MOBILE\"}",
                SendOtpRequest.class);

        assertThat(request.target()).isEqualTo("9876543210");
        assertThat(request.resolvedChannel()).isEqualTo(OtpChannelType.MOBILE);
    }

    /**
     * The `otp` field is Base64-decoded on the way in, the same way the api
     * layer encodes it on the way out.
     */
    @Test
    void readsLegacyEmailPayloadOnConfirm() throws Exception {
        VerifyOtpRequest request = objectMapper.readValue(
                "{\"email\":\"rider@example.com\",\"otp\":\"MTIzNDU2\"}",
                VerifyOtpRequest.class);

        assertThat(request.target()).isEqualTo("rider@example.com");
        assertThat(request.otp()).isEqualTo("123456");
        assertThat(request.resolvedChannel()).isEqualTo(OtpChannelType.EMAIL);
        assertThat(request.resolvedPurpose()).isEqualTo(OtpPurpose.REGISTRATION);
    }

    @Test
    void keepsExplicitChannelAndPurpose() throws Exception {
        VerifyOtpRequest request = objectMapper.readValue(
                "{\"target\":\"9876543210\",\"otp\":\"482913\","
                        + "\"channel\":\"MOBILE\",\"purpose\":\"PASSWORD_RESET\"}",
                VerifyOtpRequest.class);

        assertThat(request.resolvedChannel()).isEqualTo(OtpChannelType.MOBILE);
        assertThat(request.resolvedPurpose()).isEqualTo(OtpPurpose.PASSWORD_RESET);
    }
}
