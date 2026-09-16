package com.yuvan.busbooking.auth.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.yuvan.busbooking.auth.dto.BackupCodesResponse;
import com.yuvan.busbooking.auth.dto.TotpSetupResponse;
import com.yuvan.busbooking.auth.entity.BackupCode;
import com.yuvan.busbooking.auth.entity.TotpVerificationLog;
import com.yuvan.busbooking.auth.entity.TotpVerificationType;
import com.yuvan.busbooking.auth.repository.BackupCodeRepository;
import com.yuvan.busbooking.auth.repository.TotpVerificationLogRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class TotpService {

    private static final String ISSUER = "BusBooking";
    private static final int TOTP_PERIOD = 30; // 30 seconds
    private static final int TOTP_DIGITS = 6;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int RATE_LIMIT_MINUTES = 15;
    private static final int BACKUP_CODE_COUNT = 10;
    private static final int BACKUP_CODE_LENGTH = 8;

    private final UserRepository userRepository;
    private final TotpVerificationLogRepository verificationLogRepository;
    private final BackupCodeRepository backupCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final DefaultSecretGenerator secretGenerator;
    private final CodeVerifier codeVerifier;

    public TotpService(
            UserRepository userRepository,
            TotpVerificationLogRepository verificationLogRepository,
            BackupCodeRepository backupCodeRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.verificationLogRepository = verificationLogRepository;
        this.backupCodeRepository = backupCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.secretGenerator = new DefaultSecretGenerator();
        
        TimeProvider timeProvider = new SystemTimeProvider();
        this.codeVerifier = new DefaultCodeVerifier(
            new dev.samstevens.totp.code.DefaultCodeGenerator(HashingAlgorithm.SHA1),
            timeProvider
        );
    }

    /**
     * Generate TOTP secret and QR code for user setup
     */
    @Transactional
    public TotpSetupResponse generateTotpSecret(User user) {
        if (user.getTotpEnabled()) {
            throw new IllegalStateException("2FA is already enabled for this user");
        }

        // Generate secret
        String secret = secretGenerator.generate();
        
        // Save secret to user (not enabled yet)
        user.setTotpSecret(secret);
        userRepository.save(user);

        // Create QR data
        QrData qrData = new QrData.Builder()
                .label(user.getEmail())
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(TOTP_DIGITS)
                .period(TOTP_PERIOD)
                .build();

        // Generate QR code URI for authenticator apps
        String qrCodeUri = qrData.getUri();

        // Generate QR code image as Base64
        String qrCodeBase64 = generateQrCodeImage(qrCodeUri);

        return new TotpSetupResponse(
                secret,
                qrCodeUri,
                qrCodeBase64,
                ISSUER,
                user.getEmail()
        );
    }

    /**
     * Verify TOTP code and enable 2FA for the user
     */
    @Transactional
    public boolean verifyAndEnableTotp(Long userId, String totpCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getTotpSecret() == null) {
            throw new IllegalStateException("TOTP secret not configured");
        }

        if (user.getTotpEnabled()) {
            throw new IllegalStateException("2FA is already enabled");
        }

        // Verify the code
        boolean isValid = codeVerifier.isValidCode(user.getTotpSecret(), totpCode);

        if (isValid) {
            // Enable TOTP for user
            user.setTotpEnabled(true);
            userRepository.save(user);

            // Log successful setup
            logVerificationAttempt(userId, TotpVerificationType.SETUP, true, null, null);
        } else {
            // Log failed setup attempt
            logVerificationAttempt(userId, TotpVerificationType.SETUP, false, null, null);
        }

        return isValid;
    }

    /**
     * Verify TOTP code for login
     */
    @Transactional
    public boolean verifyTotp(Long userId, String totpCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getTotpEnabled() || user.getTotpSecret() == null) {
            throw new IllegalStateException("2FA is not enabled for this user");
        }

        // Check rate limiting
        if (isRateLimited(userId)) {
            throw new IllegalStateException(
                "Too many failed attempts. Please try again after " + RATE_LIMIT_MINUTES + " minutes."
            );
        }

        // Verify the code
        boolean isValid = codeVerifier.isValidCode(user.getTotpSecret(), totpCode);

        // Log the attempt
        logVerificationAttempt(userId, TotpVerificationType.LOGIN, isValid, null, null);

        return isValid;
    }

    /**
     * Verify backup code for login
     */
    @Transactional
    public boolean verifyBackupCode(Long userId, String backupCode) {
        BackupCode storedCodes = backupCodeRepository.findByUserId(userId)
                .orElse(null);

        if (storedCodes == null) {
            return false;
        }

        // Parse stored hashed codes (JSON array format)
        String codesJson = storedCodes.getCodesHash();
        String[] hashedCodes = parseBackupCodesJson(codesJson);

        // Check if any code matches
        for (int i = 0; i < hashedCodes.length; i++) {
            if (passwordEncoder.matches(backupCode.trim(), hashedCodes[i])) {
                // Code matched - invalidate it by replacing with empty hash
                hashedCodes[i] = "";
                storedCodes.setCodesHash(toBackupCodesJson(hashedCodes));
                storedCodes.setUsedCount(storedCodes.getUsedCount() + 1);
                backupCodeRepository.save(storedCodes);

                // Log successful verification
                logVerificationAttempt(userId, TotpVerificationType.LOGIN, true, null, null);
                return true;
            }
        }

        // No match found
        logVerificationAttempt(userId, TotpVerificationType.LOGIN, false, null, null);
        return false;
    }

    /**
     * Generate backup codes for user
     */
    @Transactional
    public BackupCodesResponse generateBackupCodes(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getTotpEnabled()) {
            throw new IllegalStateException("2FA must be enabled before generating backup codes");
        }

        // Generate random backup codes
        List<String> plainCodes = new ArrayList<>();
        List<String> hashedCodes = new ArrayList<>();

        SecureRandom random = new SecureRandom();
        for (int i = 0; i < BACKUP_CODE_COUNT; i++) {
            String code = generateBackupCode(random);
            plainCodes.add(code);
            hashedCodes.add(passwordEncoder.encode(code));
        }

        // Delete existing backup codes if any
        backupCodeRepository.findByUserId(userId).ifPresent(backupCodeRepository::delete);

        // Save new backup codes
        BackupCode backupCodeEntity = new BackupCode();
        backupCodeEntity.setUser(user);
        backupCodeEntity.setCodesHash(toBackupCodesJson(hashedCodes.toArray(new String[0])));
        backupCodeEntity.setGeneratedAt(LocalDateTime.now());
        backupCodeEntity.setUsedCount(0);
        backupCodeRepository.save(backupCodeEntity);

        return new BackupCodesResponse(
                plainCodes,
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                BACKUP_CODE_COUNT
        );
    }

    /**
     * Disable TOTP for a user
     */
    @Transactional
    public void disableTotp(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);

        // Delete backup codes
        backupCodeRepository.findByUserId(userId).ifPresent(backupCodeRepository::delete);
    }

    /**
     * Log verification attempt
     */
    public void logVerificationAttempt(
            Long userId,
            TotpVerificationType type,
            boolean success,
            String ipAddress,
            String userAgent
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        TotpVerificationLog log = new TotpVerificationLog();
        log.setUser(user);
        log.setVerificationType(type);
        log.setSuccess(success);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);

        verificationLogRepository.save(log);
    }

    /**
     * Check if user is rate limited (too many failed attempts)
     */
    public boolean isRateLimited(Long userId) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(RATE_LIMIT_MINUTES);
        long failedAttempts = verificationLogRepository.countFailedAttemptsSince(userId, since);
        return failedAttempts >= MAX_FAILED_ATTEMPTS;
    }

    /**
     * Generate QR code image as Base64 string
     */
    private String generateQrCodeImage(String qrCodeUri) {
        try {
            BitMatrix bitMatrix = new MultiFormatWriter().encode(
                    qrCodeUri,
                    BarcodeFormat.QR_CODE,
                    300,
                    300
            );

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] imageBytes = outputStream.toByteArray();

            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code image", e);
        }
    }

    /**
     * Generate a random backup code
     */
    private String generateBackupCode(SecureRandom random) {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < BACKUP_CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        // Format as XXXX-XXXX
        return code.substring(0, 4) + "-" + code.substring(4);
    }

    /**
     * Convert array of backup codes to JSON format
     */
    private String toBackupCodesJson(String[] codes) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < codes.length; i++) {
            json.append("\"").append(codes[i].replace("\"", "\\\"")).append("\"");
            if (i < codes.length - 1) {
                json.append(",");
            }
        }
        json.append("]");
        return json.toString();
    }

    /**
     * Parse JSON array of backup codes
     */
    private String[] parseBackupCodesJson(String json) {
        // Simple JSON array parser (format: ["code1","code2",...])
        String content = json.substring(1, json.length() - 1); // Remove [ and ]
        if (content.isEmpty()) {
            return new String[0];
        }
        
        String[] parts = content.split(",");
        String[] codes = new String[parts.length];
        for (int i = 0; i < parts.length; i++) {
            // Remove quotes and trim
            codes[i] = parts[i].trim().replaceAll("^\"|\"$", "");
        }
        return codes;
    }
}
