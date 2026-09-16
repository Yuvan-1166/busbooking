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
import com.yuvan.busbooking.wallet.service.WalletService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

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
    private final WalletService walletService;
    private final CustomUserDetailsService userDetailsService;

    public GoogleOAuthService(
            @Value("${app.google.client-id}") String googleClientId,
            UserRepository userRepository,
            UserGoogleCredentialRepository googleCredentialRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            JwtService jwtService,
            WalletService walletService,
            CustomUserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.googleCredentialRepository = googleCredentialRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.jwtService = jwtService;
        this.walletService = walletService;
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
     * Creates new user if doesn't exist, updates existing user's Google
     * credentials.
     *
     * @param idToken Google ID token from frontend
     * @return LoginResponse with JWT token
     * @throws IllegalArgumentException if token is invalid or verification fails
     */
    @Transactional
    public LoginResponse authenticateWithGoogle(String idToken) {
        try {
            System.out.println("=== Google OAuth Flow Started ===");
            System.out.println("Token received: " + (idToken != null ? "YES (length: " + idToken.length() + ")" : "NO"));
            
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
            var existingCredential = googleCredentialRepository.findByGoogleSub(googleSub);
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
                user = userRepository.save(user);

                // Assign PASSENGER role
                Role passengerRole = roleRepository.findByName(RoleName.PASSENGER)
                        .orElseThrow(() -> new IllegalStateException("PASSENGER role not found"));
                UserRole userRole = new UserRole();
                userRole.setUser(user);
                userRole.setRole(passengerRole);
                userRoleRepository.save(userRole);

                // Create wallet with default balance
                walletService.createWallet(user);
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
            System.out.println("Credential ID: " + credential.getId());

            // Generate JWT token
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String token = jwtService.generateToken(userDetails);
            
            System.out.println("=== JWT Token Generated ===");
            System.out.println("Token: " + token.substring(0, Math.min(50, token.length())) + "...");

            return new LoginResponse(token, "Bearer", 3600);

        } catch (Exception e) {
            System.err.println("=== Google OAuth Error ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalArgumentException("Google OAuth authentication failed: " + e.getMessage(), e);
        }
    }
}
