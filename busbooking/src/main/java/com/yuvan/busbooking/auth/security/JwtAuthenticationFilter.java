package com.yuvan.busbooking.auth.security;

import com.yuvan.busbooking.auth.service.JwtService;
import com.yuvan.busbooking.auth.service.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        System.out.println("=== JWT Filter Debug ===");
        System.out.println("Path: " + request.getRequestURI());
        System.out.println("Method: " + request.getMethod());
        System.out.println("Auth Header Present: " + (authHeader != null));

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("No Bearer token found, proceeding without authentication");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        System.out.println("Token found: " + token.substring(0, Math.min(50, token.length())) + "...");

        boolean isValid = jwtService.isTokenValid(token);
        System.out.println("Token validation result: " + isValid);

        if (!isValid) {
            System.out.println("Token validation failed!");
            filterChain.doFilter(request, response);
            return;
        }

        System.out.println("Token is valid, extracting username");
        String email;
        try {
            email = jwtService.extractUsername(token);
            System.out.println("Email extracted: " + email);
        } catch (Exception e) {
            System.out.println("Error extracting username: " + e.getMessage());
            e.printStackTrace();
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println("No existing authentication, loading user details for: " + email);
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                System.out.println("User loaded successfully");
                System.out.println("Username: " + userDetails.getUsername());
                System.out.println("Enabled: " + userDetails.isEnabled());
                System.out.println("Authorities: " + userDetails.getAuthorities());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                System.out.println("Authentication set successfully in SecurityContext");
                System.out.println("IsAuthenticated: " + authentication.isAuthenticated());
            } catch (Exception e) {
                System.out.println("ERROR loading user details: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                e.printStackTrace();
                // Don't rethrow - continue filter chain so proper error handling can occur
            }
        } else {
            System.out.println("Authentication already exists in SecurityContext");
        }

        System.out.println("Proceeding to next filter");
        filterChain.doFilter(request, response);
    }
}