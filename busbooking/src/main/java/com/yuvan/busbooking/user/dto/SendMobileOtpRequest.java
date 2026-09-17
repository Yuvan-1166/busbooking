package com.yuvan.busbooking.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request to send OTP to mobile number for verification
 */
public class SendMobileOtpRequest {

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "^\\+[1-9]\\d{1,14}$",
        message = "Mobile number must be in E.164 format (e.g., +919876543210)"
    )
    private String mobileNumber;

    public SendMobileOtpRequest() {
    }

    public SendMobileOtpRequest(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }
}
