package com.yuvan.busbooking.auth.oauth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OAuthAuthorizeResponse;
import com.yuvan.busbooking.auth.dto.OAuthCallbackRequest;
import com.yuvan.busbooking.auth.entity.UserGoogleCredential;
import com.yuvan.busbooking.auth.repository.UserGoogleCredentialRepository;
import com.yuvan.busbooking.auth.service.CustomUserDetailsService;
import com.yuvan.busbooking.auth.service.JwtService;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * OAuth provider for Google sign-in.
 *
 * <p>Google's authorization step runs client-side (Google Identity popup), so
 * {@link #authorize()} is a no-op and the flow starts at {@link #handleCallback}
 * with the ID token the client received. Verifies the token, then creates or
 * updates the local user and issues a JWT.</p>
 */
@Service
@Slf4j
public class GoogleOAuthProvider implements OAuthProvider {

    private static final String PASSENGER = "PASSENGER";

    private final GoogleIdTokenVerifier tokenVerifier;
    private final UserRepository userRepository;
    private final UserGoogleCredentialRepository googleCredentialRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public GoogleOAuthProvider(
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

        JsonFactory jsonFactory = new GsonFactory();
        this.tokenVerifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), jsonFactory)
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    @Override
    public OAuthProviderType getType() {
        return OAuthProviderType.GOOGLE;
    }

    @Override
    public OAuthAuthorizeResponse authorize() {
        // Authorization is handled by the client (Google Identity popup), so
        // there is no server-side URL to generate.
        return new OAuthAuthorizeResponse(OAuthProviderType.GOOGLE, null, null);
    }

    @Override
    @Transactional
    public LoginResponse handleCallback(OAuthCallbackRequest request) {
        try {
            validateUserType(request.userType());

            if (request.idToken() == null || request.idToken().isBlank()) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }

            GoogleIdToken googleIdToken = tokenVerifier.verify(request.idToken());
            if (googleIdToken == null) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            String googleSub = payload.getSubject();
            String email = (String) payload.get("email");
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            if (email == null) {
                throw new IllegalArgumentException("Email claim missing in Google ID token");
            }

            log.debug("Authenticating Google user {} ({})", email, request.userType());

            Optional<UserGoogleCredential> existingCredential =
                    googleCredentialRepository.findByGoogleSub(googleSub);
            if (existingCredential.isPresent()) {
                return loginWithExistingCredential(existingCredential.get(), email, name, pictureUrl);
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = createNewUser(email, name);
            }

            saveCredential(googleSub, email, name, pictureUrl, user);
            assignTemporaryPassengerRoleIfNeeded(user);

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String token = jwtService.generateToken(userDetails);

            return new LoginResponse(token, "Bearer", 3600, !user.getOnboardingCompleted());
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google OAuth authentication failed", e);
            throw new IllegalArgumentException("Google OAuth authentication failed: " + e.getMessage(), e);
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private LoginResponse loginWithExistingCredential(
            UserGoogleCredential credential,
            String email,
            String name,
            String pictureUrl
    ) {
        credential.setGoogleEmail(email);
        credential.setDisplayName(name);
        credential.setPictureUrl(pictureUrl);
        googleCredentialRepository.save(credential);

        User user = credential.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);
        return new LoginResponse(token, "Bearer", 3600);
    }

    private User createNewUser(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(null); // No password for Google-only accounts
        user.setFirstName(name != null ? name.split(" ")[0] : "User");
        user.setLastName(name != null && name.split(" ").length > 1
                ? name.split(" ")[1] : "");
        user.setPhone(null);
        user.setStatus(UserStatus.ACTIVE); // Google users are auto-verified
        user.setOnboardingCompleted(false); // Profile completion still required
        return userRepository.save(user);
    }

    private void saveCredential(String googleSub, String email, String name, String pictureUrl, User user) {
        UserGoogleCredential credential = new UserGoogleCredential();
        credential.setGoogleSub(googleSub);
        credential.setGoogleEmail(email);
        credential.setDisplayName(name);
        credential.setPictureUrl(pictureUrl);
        credential.setUser(user);
        googleCredentialRepository.save(credential);
    }

    private void assignTemporaryPassengerRoleIfNeeded(User user) {
        List<UserRole> existingRoles = userRoleRepository.findByUserIdWithRoles(user.getId());
        if (existingRoles.isEmpty()) {
            Role passengerRole = roleRepository.findByName(RoleName.PASSENGER)
                    .orElseThrow(() -> new IllegalStateException("PASSENGER role not found"));
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(passengerRole);
            userRoleRepository.save(userRole);
        }
    }

    private void validateUserType(String userType) {
        if (userType == null || (!userType.equals(PASSENGER) && !userType.equals("OPERATOR"))) {
            throw new IllegalArgumentException("Invalid userType. Must be PASSENGER or OPERATOR");
        }
    }
}