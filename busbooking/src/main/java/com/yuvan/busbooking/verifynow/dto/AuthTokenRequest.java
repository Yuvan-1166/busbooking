package com.yuvan.busbooking.verifynow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for Message Central authentication
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthTokenRequest {
    
    @NotBlank(message = "Customer ID is required")
    @JsonProperty("customerId")
    private String customerId;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @JsonProperty("email")
    private String email;
    
    @NotBlank(message = "Password is required")
    @JsonProperty("password")
    private String password;
}
