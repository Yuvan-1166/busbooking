package com.yuvan.busbooking.common.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import com.yuvan.busbooking.user.dto.UserRequest;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import com.yuvan.busbooking.user.service.UserService;

import io.github.cdimascio.dotenv.Dotenv;

@Configuration 
public class AdminInitializer {
    
    @Bean 
    @Order(2)
    CommandLineRunner initializeAdmin(
        UserService userService, 
        RoleRepository roleRepository, 
        UserRoleRepository userRoleRepository,
        UserRepository userRepository
    ) {
        Dotenv dotenv = Dotenv.load();
        return args -> {
            if(!userRepository.existsByEmail(dotenv.get("ADMIN_USERNAME"))){
                User user = userService.createUser(
                    new UserRequest(dotenv.get("ADMIN_USERNAME"), dotenv.get("ADMIN_PASSWORD"), "Admin", "User", "+91 00000 00000", UserStatus.ACTIVE)
                );

                Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                                        .orElseThrow(
                                            () -> new IllegalStateException(
                                                "Admin role no initialized"
                                            )
                                        );
                UserRole userRole = new UserRole();
                userRole.setUser(user);
                userRole.setRole(adminRole);

                userRoleRepository.save(userRole);
            }
        };
    }

}
