package com.yuvan.busbooking.auth.onboarding;

import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.operator.entity.Operator;
import com.yuvan.busbooking.operator.entity.OperatorStatus;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;

import org.springframework.stereotype.Service;

/**
 * Onboarding strategy for operator users: replaces the temporary PASSENGER
 * role with OPERATOR and provisions the operator profile.
 */
@Service
public class OperatorOnboardingStrategy extends AbstractOnboardingStrategy {

    private final OperatorRepository operatorRepository;

    public OperatorOnboardingStrategy(
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            OperatorRepository operatorRepository
    ) {
        super(roleRepository, userRoleRepository);
        this.operatorRepository = operatorRepository;
    }

    @Override
    public RoleName getRole() {
        return RoleName.OPERATOR;
    }

    @Override
    public void apply(User user, OnboardingCompleteRequest request) {
        // Remove the temporary PASSENGER role assigned at OAuth sign-up
        removeRole(user, RoleName.PASSENGER);

        ensureRole(user, RoleName.OPERATOR);

        String operatorName = request.operatorName() != null ? request.operatorName() : user.getFirstName();
        String registrationNumber = request.registrationNumber() != null ? request.registrationNumber()
                : ("AUTO_" + user.getId() + "_" + System.currentTimeMillis());
        String contactEmail = user.getEmail();

        Operator operator = new Operator();
        operator.setUser(user);
        operator.setName(operatorName);
        operator.setRegistrationNumber(registrationNumber);
        operator.setContactEmail(contactEmail);
        operator.setContactPhone(request.contactPhone());
        operator.setStatus(OperatorStatus.ACTIVE);
        operatorRepository.save(operator);
    }
}