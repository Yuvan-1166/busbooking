package com.yuvan.busbooking.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.yuvan.busbooking.auth.security.JwtAuthenticationFilter;

import java.util.Arrays;

@Configuration
@EnableMethodSecurity 
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean 
    public PasswordEncoder passwordEncoder () {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(auth -> auth

                        // Allow all OPTIONS requests (CORS preflight)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public auth endpoints (registration, login, verification, password reset)
                        .requestMatchers(
"/health",
                        "/auth/register",
                        "/auth/login",
                                "/auth/login/verify-totp",
                                "/auth/totp-alternative/send",
                                "/auth/totp-alternative/verify",
                                "/auth/verify/send",
                                "/auth/verify/confirm",
                                "/auth/forgot-password",
                                "/auth/reset-password",
                                // Unified OAuth 2.0 endpoints (Google, Twitter, …)
                                "/auth/oauth/authorize",
                                "/auth/oauth/callback",
                                // Razorpay webhook (signature validated server-side)
                                "/payments/webhook/razorpay"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/auth/verify/email").permitAll()

                        // Authenticated endpoints (onboarding, TOTP management)
                        .requestMatchers(
                                "/auth/onboarding/complete",
                                "/auth/totp/setup",
                                "/auth/totp/verify-setup",
                                "/auth/totp/disable",
                                "/auth/totp/backup-codes/generate"
                        ).authenticated()

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8080",
                "https://busbooking-frontend-kappa.vercel.app"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
    
}