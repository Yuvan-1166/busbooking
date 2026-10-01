package com.yuvan.busbooking.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class EmailVerificationTokenService {

    private static final String CLAIM_PURPOSE = "purpose";
    private static final String PURPOSE_EMAIL_VERIFICATION = "email_verification";

    private final SecretKey secretKey;
    private final int otpExpiryMinutes;
    private final String frontendUrl;

    public EmailVerificationTokenService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.otp.expiry-minutes:10}") int otpExpiryMinutes,
            @Value("${app.frontend.url}") String frontendUrl
    ) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.otpExpiryMinutes = otpExpiryMinutes;
        this.frontendUrl = frontendUrl;
    }

    public String buildVerificationLink(String email) {
        String token = generateToken(email);
        return frontendUrl + "/verify-email?token=" + token;
    }

    private String generateToken(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + (long) otpExpiryMinutes * 60 * 1000);

        return Jwts.builder()
                .subject(email)
                .claim(CLAIM_PURPOSE, PURPOSE_EMAIL_VERIFICATION)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public String extractEmail(String token) {
        Claims claims = parseClaims(token);
        validatePurposeClaim(claims);
        return claims.getSubject();
    }

    public boolean isValid(String token) {
        try {
            Claims claims = parseClaims(token);
            validatePurposeClaim(claims);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private void validatePurposeClaim(Claims claims) {
        String purpose = claims.get(CLAIM_PURPOSE, String.class);
        if (!PURPOSE_EMAIL_VERIFICATION.equals(purpose)) {
            throw new JwtException("Token is not an email verification token");
        }
    }
}
