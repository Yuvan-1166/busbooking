package com.yuvan.busbooking.auth.controller;

import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.TwitterAuthorizeResponse;
import com.yuvan.busbooking.auth.dto.TwitterCallbackRequest;
import com.yuvan.busbooking.auth.service.TwitterOAuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for Twitter (X) OAuth 2.0 PKCE authentication.
 *
 * <h3>Endpoints</h3>
 * <ul>
 *   <li>{@code GET  /api/v1/auth/twitter/authorize}  – Step 1: get authorization URL</li>
 *   <li>{@code POST /api/v1/auth/twitter/callback}   – Step 2: exchange code for JWT</li>
 * </ul>
 *
 * <h3>Typical front-end flow</h3>
 * <ol>
 *   <li>Frontend calls {@code GET /authorize} to receive {@code authorizeUrl} and {@code state}.</li>
 *   <li>Frontend saves {@code state} in session storage and redirects to {@code authorizeUrl}.</li>
 *   <li>Twitter redirects to your configured callback URI with {@code ?code=...&state=...}.</li>
 *   <li>Frontend verifies the returned {@code state} matches the saved one (CSRF check)
 *       and calls {@code POST /callback} with code, state, and userType.</li>
 *   <li>Backend validates state, exchanges code for tokens, fetches user info, issues JWT.</li>
 * </ol>
 */
@RestController
@RequestMapping("/api/v1/auth/twitter")
public class TwitterOAuthController {

    private final TwitterOAuthService twitterOAuthService;

    public TwitterOAuthController(TwitterOAuthService twitterOAuthService) {
        this.twitterOAuthService = twitterOAuthService;
    }

    /**
     * Step 1 – Generate the Twitter authorization URL.
     *
     * <p>The frontend should redirect the browser (or open a popup window) to the returned
     * {@code authorizeUrl}.  Store the returned {@code state} in session storage and verify
     * it against the value Twitter echoes back in the redirect to prevent CSRF.</p>
     *
     * <p>GET /api/v1/auth/twitter/authorize</p>
     *
     * @return {@link TwitterAuthorizeResponse} containing the authorization URL and state token.
     */
    @GetMapping("/authorize")
    public TwitterAuthorizeResponse authorize() {
        return twitterOAuthService.buildAuthorizeUrl();
    }

    /**
     * Step 2 – Handle Twitter's callback and issue a JWT.
     *
     * <p>After the user approves access on Twitter's page, Twitter redirects to your
     * configured redirect URI with {@code ?code=...&state=...}.  The frontend extracts
     * those values and POSTs them here along with the desired {@code userType}.</p>
     *
     * <p>On success the response is identical to a normal login: {@code accessToken},
     * {@code tokenType}, and {@code expiresIn}.  New users additionally receive
     * {@code "onboardingRequired": true} to trigger profile completion.</p>
     *
     * <p>POST /api/v1/auth/twitter/callback</p>
     *
     * @param request {@link TwitterCallbackRequest} with code, state, and userType.
     * @return {@link LoginResponse} with JWT (and optional onboarding flag).
     */
    @PostMapping("/callback")
    public LoginResponse callback(@Valid @RequestBody TwitterCallbackRequest request) {
        return twitterOAuthService.handleCallback(
                request.code(),
                request.state(),
                request.userType()
        );
    }
}
