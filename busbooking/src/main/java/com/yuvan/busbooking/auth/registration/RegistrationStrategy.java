package com.yuvan.busbooking.auth.registration;

import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;


public interface RegistrationStrategy {

    RegistrationType getType();

    RegisterResponse register(RegisterRequest request);
}