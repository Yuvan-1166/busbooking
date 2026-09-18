package com.yuvan.busbooking.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.TwitterAuthorizeResponse;
import com.yuvan.busbooking.auth.entity.UserTwitterCredential;
import com.yuvan.busbooking.auth.repository.UserTwitterCredentialRepository;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service implementing the Twitter (X) OAuth 2.0 Authorization Code flow with PKCE.
 *
 * <h3>Flow overview</h3>
 * <ol>
 *   <li>{@link #buildAuthorizeUrl()} – generates a {@code code_verifier} + {@code code_challenge},
 *       persists the verifier in memory keyed by {@code state}, and returns the Twitter
 *       authorization URL for the frontend to redirect to.</li>
 *   <li>{@link #handleCallback(String, String, String)} – validates the {@code state},
 *       retrieves the stored verifier, exchanges the {@code code} for tokens via the
 *       Twitter token endpoint, fetches the user's profile, then creates or updates the
 *       local user record and issues a JWT.</li>
 * </ol>
 *
 * <h3>PKCE</h3>
 * Twitter mandates PKCE for public / confidential clients.  We use {@code S256}:
 * {@code code_challenge = BASE64URL(SHA256(code_verifier))}.
 *
 * <h3>State store</h3>
 * The verifier is stored in a {@link ConcurrentHashMap} with a per-entry TTL enforced at
 * retrieval time.  This keeps the service stateless from the database perspective while
 * still protecting against CSRF.  In a multi-instance deployment you would replace this
 * with a Redis cache.
 */
@Service
public class TwitterOAuthService {

    // ── configuration ─────────────────────────────────────────────────────────

    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final String authUrl;
    private final String tokenUrl;
    private final String userInfoUrl;

    // ── collaborators ──────────────────────────────────────────────────────────

    private final UserRepository userRepository;
    private final UserTwitterCredentialRepository twitterCredentialRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ── PKCE state store ───────────────────────────────────────────────────────

    /** Maps {@code state} → {@code PendingAuth(codeVerifier, expiresAt)}. */
    private final Map<String, PendingAuth> pendingAuthStore = new ConcurrentHashMap<>();

    /** How long (ms) a pending auth entry lives before it is considered stale. */
    private static final long STATE_TTL_MS = 10 * 60 * 1000L; // 10 minutes

    /** Twitter scopes we request. */
    private static final String SCOPES = "tweet.read users.read offline.access";

    // ── constructor ────────────────────────────────────────────────────────────

    public TwitterOAuthService(
            @Value("${app.twitter.client-id}") String clientId,
            @Value("${app.twitter.client-secret}") String clientSecret,
            @Value("${app.twitter.redirect-uri}") String redirectUri,
            @Value("${app.twitter.auth-url}") String authUrl,
            @Value("${app.twitter.token-url}") String tokenUrl,
            @Value("${app.twitter.user-info-url}") String userInfoUrl,
            UserRepository userRepository,
            UserTwitterCredentialRepository twitterCredentialRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.authUrl = authUrl;
        this.tokenUrl = tokenUrl;
        this.userInfoUrl = userInfoUrl;
        this.userRepository = userRepository;
        this.twitterCredentialRepository = twitterCredentialRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    // ── Step 1: build authorization URL ───────────────────────────────────────

    /**
     * Generates a PKCE {@code code_verifier} + {@code code_challenge}, stores the verifier
     * against a random {@code state} token, and returns the full Twitter authorization URL.
     *
     * @return {@link TwitterAuthorizeResponse} containing the URL and the state token.
     */
    public TwitterAuthorizeResponse buildAuthorizeUrl() {
        // Purge stale entries on every authorize call (lightweight GC)
        evictExpiredStates();

        String codeVerifier = generateCodeVerifier();
        String codeChallenge = generateCodeChallenge(codeVerifier);
        String state = generateState();

        pendingAuthStore.put(state, new PendingAuth(codeVerifier, System.currentTimeMillis() + STATE_TTL_MS));

        String url = authUrl
                + "?response_type=code"
                + "&client_id=" + encode(clientId)
                + "&redirect_uri=" + encode(redirectUri)
                + "&scope=" + encode(SCOPES)
                + "&state=" + encode(state)
                + "&code_challenge=" + encode(codeChallenge)
                + "&code_challenge_method=S256";

        return new TwitterAuthorizeResponse(url, state);
    }

    // ── Step 2: handle callback ────────────────────────────────────────────────

    /**
     * Validates the callback from Twitter, exchanges the authorization code for tokens,
     * fetches the user's Twitter profile, then creates or updates the local user record
     * and issues a JWT.
     *
     * @param code     Authorization code from Twitter's redirect.
     * @param state    State token returned by Twitter (must match the one we issued).
     * @param userType "PASSENGER" or "OPERATOR".
     * @return {@link LoginResponse} with a JWT (and {@code onboardingRequired} flag if new).
     */
    @Transactional
    public LoginResponse handleCallback(String code, String state, String userType) {
        validateUserType(userType);

        // 1. Validate state and retrieve verifier
        String codeVerifier = consumeState(state);

        // 2. Exchange code for access token
        String accessToken = exchangeCodeForToken(code, codeVerifier);

        // 3. Fetch user info from Twitter
        TwitterUserInfo userInfo = fetchUserInfo(accessToken);

        // 4. Create or update local user + credential
        return createOrUpdateUser(userInfo, userType);
    }

    // ── private helpers ────────────────────────────────────────────────────────

    /** Validates state and returns the code_verifier; removes entry from store. */
    private String consumeState(String state) {
        PendingAuth pending = pendingAuthStore.remove(state);
        if (pending == null) {
            throw new IllegalArgumentException("Invalid or expired OAuth state token");
        }
        if (System.currentTimeMillis() > pending.expiresAt()) {
            throw new IllegalArgumentException("OAuth state token has expired. Please restart the sign-in flow.");
        }
        return pending.codeVerifier();
    }

    /** Exchanges the authorization code for a Twitter access token via Basic auth. */
    private String exchangeCodeForToken(String code, String codeVerifier) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // Twitter requires HTTP Basic auth with client_id:client_secret
        String credentials = clientId + ":" + clientSecret;
        String basicAuth = Base64.getEncoder().encodeToString(
                credentials.getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", redirectUri);
        body.add("code_verifier", codeVerifier);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Twitter token exchange failed: " + response.getStatusCode());
            }

            JsonNode json = objectMapper.readTree(response.getBody());
            JsonNode tokenNode = json.get("access_token");
            if (tokenNode == null || tokenNode.isNull()) {
                throw new IllegalStateException("Twitter token response missing access_token");
            }
            return tokenNode.asText();

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to exchange Twitter authorization code: " + e.getMessage(), e);
        }
    }

    /** Fetches the authenticated user's Twitter profile. */
    private TwitterUserInfo fetchUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        // Request the fields we need
        String url = userInfoUrl + "?user.fields=id,name,username,profile_image_url,email";

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Twitter user info fetch failed: " + response.getStatusCode());
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode data = root.path("data");

            String twitterId = data.path("id").asText();
            String username = data.path("username").asText();
            String name = data.path("name").asText();
            String profileImageUrl = data.path("profile_image_url").asText(null);
            String email = data.path("email").asText();

            if (twitterId.isEmpty()) {
                throw new IllegalStateException("Twitter user info response missing 'id'");
            }

            return new TwitterUserInfo(twitterId, username, name, profileImageUrl, email);

        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to fetch Twitter user info: " + e.getMessage(), e);
        }
    }

    /** Creates or updates the local user record and Twitter credential, then issues JWT. */
    private LoginResponse createOrUpdateUser(TwitterUserInfo info, String userType) {
        // Returning user: credential already exists
        var existingCredential = twitterCredentialRepository.findByTwitterId(info.twitterId());
        if (existingCredential.isPresent()) {
            UserTwitterCredential credential = existingCredential.get();
            // Sync mutable fields (username and display name can change)
            credential.setTwitterUsername(info.username());
            credential.setDisplayName(info.name());
            credential.setProfileImageUrl(info.profileImageUrl());
            twitterCredentialRepository.save(credential);

            User user = credential.getUser();
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String token = jwtService.generateToken(userDetails);
            return new LoginResponse(token, "Bearer", 3600L);
        }

        // Determine email: use real email from Twitter if available, fall back to synthetic
        String accountEmail = (info.email() != null && !info.email().isBlank())
                ? info.email()
                : buildSyntheticEmail(info.twitterId());

        // Check if user with this email already exists (link Twitter to existing account)
        User user = userRepository.findByEmail(accountEmail).orElse(null);
        boolean isNewUser = (user == null);

        if (isNewUser) {
            user = new User();
            user.setEmail(accountEmail);
            user.setPasswordHash(null); // OAuth-only account
            user.setFirstName(extractFirstName(info.name()));
            user.setLastName(extractLastName(info.name()));
            user.setPhone(null);
            user.setStatus(UserStatus.ACTIVE); // OAuth users are auto-verified
            user.setOnboardingCompleted(false); // Let user fill in profile
            user = userRepository.save(user);

            // Assign a temporary PASSENGER role so the onboarding JWT is valid
            // The user selects their final role during onboarding
            Role passengerRole = roleRepository.findByName(RoleName.PASSENGER)
                    .orElseThrow(() -> new IllegalStateException("PASSENGER role not found"));
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(passengerRole);
            userRoleRepository.save(userRole);
        }

        // Create Twitter credential record
        UserTwitterCredential credential = new UserTwitterCredential();
        credential.setTwitterId(info.twitterId());
        credential.setTwitterUsername(info.username());
        credential.setDisplayName(info.name());
        credential.setProfileImageUrl(info.profileImageUrl());
        credential.setUser(user);
        twitterCredentialRepository.save(credential);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        // onboardingRequired tells the frontend to prompt the user to complete their profile
        // Only for brand-new users; existing users don't need onboarding
        return new LoginResponse(token, "Bearer", 3600L, isNewUser && !user.getOnboardingCompleted());
    }

    // ── PKCE helpers ───────────────────────────────────────────────────────────

    /**
     * Generates a cryptographically random code verifier.
     * Length 64 bytes → 86 Base64URL characters (well within 43-128 char limit).
     */
    private String generateCodeVerifier() {
        byte[] bytes = new byte[64];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Derives the PKCE S256 code challenge: {@code BASE64URL(SHA-256(ASCII(codeVerifier)))}.
     */
    private String generateCodeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate PKCE code challenge", e);
        }
    }

    /** Generates a cryptographically random state token (CSRF protection). */
    private String generateState() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** URL-encodes a value using UTF-8. */
    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    /** Removes state entries that have passed their TTL. */
    private void evictExpiredStates() {
        long now = System.currentTimeMillis();
        pendingAuthStore.entrySet().removeIf(e -> now > e.getValue().expiresAt());
    }

    // ── user helpers ───────────────────────────────────────────────────────────

    /**
     * Builds a synthetic email from the Twitter ID so we have a unique, stable
     * email for the user record when Twitter API doesn't return real email
     * (e.g., free tier API plans).
     */
    private String buildSyntheticEmail(String twitterId) {
        return "twitter_" + twitterId + "@twitter.oauth.local";
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "User";
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts[0];
    }

    private String extractLastName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "";
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "";
    }

    private void validateUserType(String userType) {
        if (userType == null || (!userType.equals("PASSENGER") && !userType.equals("OPERATOR"))) {
            throw new IllegalArgumentException("Invalid userType. Must be 'PASSENGER' or 'OPERATOR'");
        }
    }

    // ── inner records ──────────────────────────────────────────────────────────

    /** Short-lived state entry holding the PKCE verifier and an expiry timestamp. */
    private record PendingAuth(String codeVerifier, long expiresAt) {}

    /** Parsed Twitter user profile fields. */
    private record TwitterUserInfo(
            String twitterId,
            String username,
            String name,
            String profileImageUrl,
            String email
    ) {}
}
