package com.yuvan.busbooking.auth.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMs;
    private static final long TEMP_TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.secretKey = Keys.hmacShaKeyFor(
                io.jsonwebtoken.io.Decoders.BASE64.decode(secret)
        );
        this.expirationMs = expirationMs;
    }

    public String generateToken(UserDetails userDetails) {

        String roles = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Generate temporary token for TOTP verification (5 min expiry)
     */
    public String generateTempToken(UserDetails userDetails) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + TEMP_TOKEN_EXPIRATION_MS);

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("temp", true)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Generate temporary token from email (for post-OTP verification TOTP setup)
     */
    public String generateTempTokenFromEmail(String email) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + TEMP_TOKEN_EXPIRATION_MS);

        return Jwts.builder()
                .subject(email)
                .claim("temp", true)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Extract username from temporary token
     */
    public String extractUsernameFromTempToken(String token) {
        return extractUsername(token);
    }

    public String extractUsername(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isTokenValid(String token) {

        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);

            return true;

        } catch (Exception e) {
            return false;
        }
    }
}