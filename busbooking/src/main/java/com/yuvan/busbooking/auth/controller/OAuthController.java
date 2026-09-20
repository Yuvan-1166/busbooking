package com.yuvan.busbooking.auth.controller;

import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OAuthAuthorizeRequest;
import com.yuvan.busbooking.auth.dto.OAuthAuthorizeResponse;
import com.yuvan.busbooking.auth.dto.OAuthCallbackRequest;
import com.yuvan.busbooking.auth.service.OAuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Unified OAuth endpoints. The provider is selected per-request in the body,
 * so each new identity provider reuses these two endpoints.
 *
 * <p>POST /api/v1/auth/oauth/authorize – step 1: get authorization URL</p>
 * <p>POST /api/v1/auth/oauth/callback  – step 2: exchange code / token for JWT</p>
 */
@RestController
@RequestMapping("/api/v1/auth/oauth")
public class OAuthController {

    private final OAuthService oauthService;

    public OAuthController(OAuthService oauthService) {
        this.oauthService = oauthService;
    }

    /**
     * Step 1 – Generate the authorization URL for the requested provider.
     *
     * <p>{@code POST /api/v1/auth/oauth/authorize}</p>
     *
     * @param request the provider to start the flow for.
     * @return the provider's authorization URL and an opaque CSRF state token.
     */
    @PostMapping("/authorize")
    public OAuthAuthorizeResponse authorize(
            @Valid @RequestBody OAuthAuthorizeRequest request
    ) {
        return oauthService.authorize(request.provider());
    }

    /**
     * Step 2 – Complete the flow and receive a JWT.
     *
     * <p>{@code POST /api/v1/auth/oauth/callback}</p>
     *
     * @param request provider-specific callback payload (see {@link OAuthCallbackRequest}).
     * @return a login response identical to a normal login.
     */
    @PostMapping("/callback")
    public LoginResponse callback(
            @Valid @RequestBody OAuthCallbackRequest request
    ) {
        return oauthService.handleCallback(request);
    }
}