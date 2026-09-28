package com.yuvan.busbooking.auth.onboarding;

import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;

public interface OnboardingStrategy {

    RoleName getRole();

    void apply(User user, OnboardingCompleteRequest request);
}