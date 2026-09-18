package com.yuvan.busbooking.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.entity.UserGoogleCredential;
import com.yuvan.busbooking.auth.repository.UserGoogleCredentialRepository;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling Google OAuth2 authentication.
 * Verifies Google ID tokens, creates or updates users, and issues JWT tokens.
 */
@Service
public class GoogleOAuthService {

    private final GoogleIdTokenVerifier tokenVerifier;
    private final UserRepository userRepository;
    private final UserGoogleCredentialRepository googleCredentialRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public GoogleOAuthService(
            @Value("${app.google.client-id}") String googleClientId,
            UserRepository userRepository,
            UserGoogleCredentialRepository googleCredentialRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
        ) {
        this.userRepository = userRepository;
        this.googleCredentialRepository = googleCredentialRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;

        // Initialize Google ID Token verifier
        JsonFactory jsonFactory = new GsonFactory();
        this.tokenVerifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), jsonFactory)
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    /**
     * Authenticates user with Google ID token.
     * Creates new user if doesn't exist, updates existing user's Google credentials.
     * Supports both PASSENGER and OPERATOR user types.
     *
     * @param idToken Google ID token from frontend
     * @param userType "PASSENGER" or "OPERATOR"
     * @return LoginResponse with JWT token
     * @throws IllegalArgumentException if token is invalid or verification fails
     */
    @Transactional
    public LoginResponse authenticateWithGoogle(String idToken, String userType) {
        try {
            System.out.println("=== Google OAuth Flow Started ===");
            System.out.println("User Type: " + userType);
            System.out.println("Token received: " + (idToken != null ? "YES (length: " + idToken.length() + ")" : "NO"));
            
            if (userType == null || (!userType.equals("PASSENGER") && !userType.equals("OPERATOR"))) {
                throw new IllegalArgumentException("Invalid userType. Must be PASSENGER or OPERATOR");
            }
            
            // Verify the token

            GoogleIdToken googleIdToken = tokenVerifier.verify(idToken);
            System.out.println("Token verification: " + (googleIdToken != null ? "SUCCESS" : "FAILED"));

            if (googleIdToken == null) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            String googleSub = payload.getSubject();
            String email = (String) payload.get("email");
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            System.out.println("Email: " + email);
            System.out.println("Name: " + name);
            System.out.println("Google Sub: " + googleSub);

            if (email == null) {
                throw new IllegalArgumentException("Email claim missing in Google ID token");
            }

            // Check if user with this Google sub already exists
            Optional<UserGoogleCredential> existingCredential = googleCredentialRepository.findByGoogleSub(googleSub);
            if (existingCredential.isPresent()) {
                // Update existing credential
                UserGoogleCredential credential = existingCredential.get();
                credential.setGoogleEmail(email);
                credential.setDisplayName(name);
                credential.setPictureUrl(pictureUrl);
                googleCredentialRepository.save(credential);

                // Generate JWT for existing user
                User user = credential.getUser();
                UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
                String token = jwtService.generateToken(userDetails);

                return new LoginResponse(token, "Bearer", 3600);
            }

            // Create new user if email not already registered
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                // Create new user account (Google users have no password)
                user = new User();
                user.setEmail(email);
                user.setPasswordHash(null); // No password for Google-only accounts
                user.setFirstName(name != null ? name.split(" ")[0] : "User");
                user.setLastName(name != null && name.split(" ").length > 1 ? name.split(" ")[1] : "");
                user.setPhone(null);
                user.setStatus(UserStatus.ACTIVE); // Google users are auto-verified
                user.setOnboardingCompleted(false); // Mark as pending onboarding
                user = userRepository.save(user);

                System.out.println("New Google user created (pending onboarding): " + user.getId());
                
                // Do NOT assign role here - let user select during onboarding
                // Role will be assigned after profile completion
            }

            // Create Google credential record
            UserGoogleCredential credential = new UserGoogleCredential();
            credential.setGoogleSub(googleSub);
            credential.setGoogleEmail(email);
            credential.setDisplayName(name);
            credential.setPictureUrl(pictureUrl);
            credential.setUser(user);
            googleCredentialRepository.save(credential);
            
            System.out.println("=== Google Credential Saved ===");
            System.out.println("User ID: " + user.getId());
            System.out.println("Email: " + user.getEmail());
            System.out.println("Onboarding Completed: " + user.getOnboardingCompleted());
            System.out.println("Credential ID: " + credential.getId());

            // For JWT generation, assign PASSENGER role temporarily if user has no role yet
            // This allows them to access the onboarding page
            List<UserRole> existingRole = userRoleRepository.findByUserIdWithRoles(user.getId());
            if (existingRole.isEmpty()) {
                Role passengerRole = roleRepository.findByName(RoleName.PASSENGER)
                        .orElseThrow(() -> new IllegalStateException("PASSENGER role not found"));
                UserRole userRole = new UserRole();
                userRole.setUser(user);
                userRole.setRole(passengerRole);
                userRoleRepository.save(userRole);
                System.out.println("Temporary PASSENGER role assigned for onboarding");
            }

            // Generate JWT token
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String token = jwtService.generateToken(userDetails);
            
            System.out.println("=== JWT Token Generated ===");
            System.out.println("Token: " + token.substring(0, Math.min(50, token.length())) + "...");
            System.out.println("Onboarding Required: " + !user.getOnboardingCompleted());

            // Return response with onboardingRequired flag
            // onboardingRequired = true means user needs to complete profile
            return new LoginResponse(
                    token,
                    "Bearer",
                    3600,
                    !user.getOnboardingCompleted()
            );

        } catch (Exception e) {
            System.err.println("=== Google OAuth Error ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalArgumentException("Google OAuth authentication failed: " + e.getMessage(), e);
        }
    }
}
