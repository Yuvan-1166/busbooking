package com.yuvan.busbooking.user.controller;

import com.yuvan.busbooking.auth.dto.VerifyTwitterEmailRequest;
import com.yuvan.busbooking.user.dto.UserRequest;
import com.yuvan.busbooking.user.dto.UserResponse;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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

    @PostMapping("/me/verify-mobile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> verifyMobile() {
        return ResponseEntity.ok(
            userService.verifyMobile()
        );
    }

    /**
     * Verifies email OTP for Twitter OAuth users and updates their account email.
     * 
     * Twitter's free tier API doesn't expose email, so users provide it during onboarding.
     * This endpoint validates the OTP and saves the verified email address.
     *
     * POST /api/v1/users/me/verify-twitter-email
     * Requires authentication.
     */
    @PostMapping("/me/verify-twitter-email")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> verifyTwitterEmail(
            @Valid @RequestBody VerifyTwitterEmailRequest request) {
        return ResponseEntity.ok(userService.verifyTwitterEmail(request));
    }
    
}