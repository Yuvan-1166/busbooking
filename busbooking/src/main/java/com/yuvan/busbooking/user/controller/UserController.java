package com.yuvan.busbooking.user.controller;

import com.yuvan.busbooking.user.dto.UserRequest;
import com.yuvan.busbooking.user.dto.UserResponse;
import com.yuvan.busbooking.user.dto.SendMobileOtpRequest;
import com.yuvan.busbooking.user.dto.VerifyMobileOtpRequest;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.service.UserService;
import com.yuvan.busbooking.auth.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final OtpService otpService;

    public UserController(UserService userService, OtpService otpService) {
        this.userService = userService;
        this.otpService = otpService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody UserRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> findAll() {

        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> findById(
            @PathVariable Long id) {

        return ResponseEntity.ok(userService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request) {

        return ResponseEntity.ok(
                userService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        userService.delete(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> findMe() {
        return ResponseEntity.ok(userService.findMe());
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> update(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(
            userService.update(request)
        );
    }

    /**
     * Send OTP to mobile number for verification
     * POST /api/v1/users/me/mobile/send-otp
     */
    @PostMapping("/me/mobile/send-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> sendMobileOtp(
            @Valid @RequestBody SendMobileOtpRequest request,
            Authentication authentication) {
        
        String email = authentication.getName();
        User user = userService.findMe();
        
        // Update mobile number in user record
        user.setMobileNumber(request.getMobileNumber());
        user.setMobileVerified(false);
        user.setMobileVerifiedAt(null);
        userService.saveUser(user);
        
        // Generate and send OTP via SMS
        otpService.generateAndSendMobileOtp(email, request.getMobileNumber());
        
        return ResponseEntity.ok(Map.of(
            "message", "OTP sent to your mobile number",
            "mobileNumber", request.getMobileNumber()
        ));
    }

    /**
     * Verify mobile OTP
     * POST /api/v1/users/me/mobile/verify-otp
     */
    @PostMapping("/me/mobile/verify-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> verifyMobileOtp(
            @Valid @RequestBody VerifyMobileOtpRequest request,
            Authentication authentication) {
        
        String email = authentication.getName();
        
        // Verify OTP and mark mobile as verified
        otpService.verifyMobileOtp(email, request.getOtp().trim());
        
        return ResponseEntity.ok(Map.of(
            "message", "Mobile number verified successfully"
        ));
    }
    
}