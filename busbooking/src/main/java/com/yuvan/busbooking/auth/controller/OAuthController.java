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

@RestController
@RequestMapping("/api/v1/auth/oauth")
public class OAuthController {

    private final OAuthService oauthService;

    public OAuthController(OAuthService oauthService) {
        this.oauthService = oauthService;
    }

    @PostMapping("/authorize")
    public OAuthAuthorizeResponse authorize(
            @Valid @RequestBody OAuthAuthorizeRequest request
    ) {
        return oauthService.authorize(request.provider());
    }

    @PostMapping("/callback")
    public LoginResponse callback(
            @Valid @RequestBody OAuthCallbackRequest request
    ) {
        return oauthService.handleCallback(request);
    }
}