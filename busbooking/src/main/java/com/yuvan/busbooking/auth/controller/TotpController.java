package com.yuvan.busbooking.auth.controller;

import com.yuvan.busbooking.auth.dto.BackupCodesResponse;
import com.yuvan.busbooking.auth.dto.DisableTotpRequest;
import com.yuvan.busbooking.auth.dto.MessageResponse;
import com.yuvan.busbooking.auth.dto.TotpSetupResponse;
import com.yuvan.busbooking.auth.dto.TotpVerifySetupRequest;
import com.yuvan.busbooking.auth.service.JwtService;
import com.yuvan.busbooking.auth.service.TotpService;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/totp")
public class TotpController {

    private final TotpService totpService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public TotpController(
            TotpService totpService,
            JwtService jwtService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.totpService = totpService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Generate TOTP secret and QR code for authenticated user
     * Used when user wants to enable 2FA from their profile
     * 
     * POST /api/v1/auth/totp/setup
     * Requires authentication
     */
    @PostMapping("/setup")
    public TotpSetupResponse setupTotp() {
        // Get current authenticated user's email
        String email = SecurityUtils.getCurrentUserEmail();
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return totpService.generateTotpSecret(user);
    }

    /**
     * Verify TOTP code during initial setup and enable 2FA
     * 
     * POST /api/v1/auth/totp/verify-setup
     * Requires authentication
     */
    @PostMapping("/verify-setup")
    public MessageResponse verifySetup(@Valid @RequestBody TotpVerifySetupRequest request) {
        // Get current authenticated user's email
        String email = SecurityUtils.getCurrentUserEmail();
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean verified = totpService.verifyAndEnableTotp(user.getId(), request.totpCode());

        if (!verified) {
            throw new IllegalArgumentException("Invalid verification code");
        }

        return new MessageResponse("Two-factor authentication enabled successfully.");
    }

    /**
     * Disable TOTP for authenticated user
     * Requires password confirmation for security
     * 
     * POST /api/v1/auth/totp/disable
     * Requires authentication
     */
    @PostMapping("/disable")
    public MessageResponse disableTotp(@Valid @RequestBody DisableTotpRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                    .orElseThrow(
                        () -> new ResourceNotFoundException(
                            "User Not found"
                        )
                    );

        // Verify password
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid password");
        }

        totpService.disableTotp(user.getId());

        return new MessageResponse("Two-factor authentication has been disabled.");
    }

    /**
     * Generate backup codes for authenticated user
     * 
     * POST /api/v1/auth/totp/backup-codes/generate
     * Requires authentication
     */
    @PostMapping("/backup-codes/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public BackupCodesResponse generateBackupCodes() {
        String email = SecurityUtils.getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                    .orElseThrow(
                        () -> new ResourceNotFoundException(
                            "User Not found"
                        )
                    );

        return totpService.generateBackupCodes(user.getId());
    }
}
