package com.yuvan.busbooking.auth.dto;

/**
 * Response containing TOTP setup information including QR code
 */
public record TotpSetupResponse(
        String secret,
        String qrCodeUri,
        String qrCodeBase64,
        String issuer,
        String accountName
) {
}
