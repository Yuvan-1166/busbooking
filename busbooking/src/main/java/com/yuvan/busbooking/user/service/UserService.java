package com.yuvan.busbooking.user.service;

import com.yuvan.busbooking.auth.dto.VerifyTwitterEmailRequest;
import com.yuvan.busbooking.auth.dto.VerifyTwitterEmailResponse;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.service.JwtService;
import com.yuvan.busbooking.auth.service.OtpService;
import com.yuvan.busbooking.auth.service.CustomUserDetailsService;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.dto.UserRequest;
import com.yuvan.busbooking.user.dto.UserResponse;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            OtpService otpService,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    public UserResponse create(UserRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();

        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setStatus(
                request.status() != null
                        ? request.status()
                        : UserStatus.ACTIVE
        );

        return toResponse(userRepository.save(user));
    }

    public User createUser(UserRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();

        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setStatus(
                request.status() != null
                        ? request.status()
                        : UserStatus.ACTIVE
        );

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public User findMe() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                    .orElseThrow(
                        () -> new ResourceNotFoundException(
                            "User not found: " + email
                        )
                    );
        return user;
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + id
                        )
                );

        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        ));
    }

    public UserResponse update(Long id, UserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + id
                        )
                );

        if (!user.getEmail().equals(request.email())
                && userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());

        if (request.status() != null) {
            user.setStatus(request.status());
        }

        return toResponse(userRepository.save(user));
    }
    
    public UserResponse update(UserRequest request) {

        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                    .orElseThrow(
                        () -> new ResourceNotFoundException(
                            "User not found" + email
                        )
                    );

        if(!request.email().equals(user.getEmail()) && userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException(
                "Email already exists"
            );
        }
        
        user.setEmail(request.email());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        
        if(request.status() != null)
            user.setStatus(request.status());

        return toResponse(user);
        
    }

    public void delete(Long id) {

        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "User not found: " + id
            );
        }

        userRepository.deleteById(id);
    }

    /**
     * Verifies email OTP for Twitter OAuth users and updates their account email.
     * 
     * <p>Flow:</p>
     * <ol>
     *   <li>User provides email + OTP received in onboarding</li>
     *   <li>Verify OTP matches the email</li>
     *   <li>Check email isn't already registered</li>
     *   <li>Update user's email and clear twitterEmailPending flag</li>
     *   <li>Generate a NEW JWT with the new email in the subject claim</li>
     *   <li>Return the JWT and updated user data</li>
     * </ol>
     *
     * @param request {@link VerifyTwitterEmailRequest} with email and OTP
     * @return {@link VerifyTwitterEmailResponse} with new JWT and user data
     * @throws IllegalArgumentException if email is already taken or OTP is invalid
     */
    public VerifyTwitterEmailResponse verifyTwitterEmail(VerifyTwitterEmailRequest request) {
        // Get current authenticated user
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify the user is a Twitter account pending email
        if (!user.getTwitterEmailPending()) {
            throw new IllegalStateException("This user is not pending Twitter email verification");
        }

        // Verify OTP for the new email
        otpService.verify(request.email(), request.otp(), OtpPurpose.REGISTRATION);

        // Check if email is already registered
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email address is already registered");
        }

        // Update user with verified email and clear pending flag
        user.setEmail(request.email());
        user.setTwitterEmailPending(false);
        User updated = userRepository.save(user);

        // Generate NEW JWT with the updated email in the subject claim
        UserDetails userDetails = userDetailsService.loadUserByUsername(updated.getEmail());
        String newAccessToken = jwtService.generateToken(userDetails);

        return new VerifyTwitterEmailResponse(
                newAccessToken,
                "Bearer",
                3600L,
                updated.getEmail(),
                updated.getTwitterEmailPending()
        );
    }

    private UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getTotpEnabled(),
                user.getMobileVerified(),
                user.getMobileVerifiedAt()
        );
    }

    /**
     * Save user entity directly (used for mobile verification updates)
     */
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Mark user's mobile number as verified
     */
    public UserResponse verifyMobile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userId
                        )
                );

        user.setMobileVerified(true);
        user.setMobileVerifiedAt(java.time.LocalDateTime.now());
        
        return toResponse(userRepository.save(user));
    }

    /**
     * Mark current user's mobile number as verified
     */
    public UserResponse verifyMobile() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + email
                        )
                );

        user.setMobileVerified(true);
        user.setMobileVerifiedAt(java.time.LocalDateTime.now());
        
        return toResponse(userRepository.save(user));
    }
    
}