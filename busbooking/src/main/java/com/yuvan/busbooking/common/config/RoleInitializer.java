package com.yuvan.busbooking.common.config;

import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
public class RoleInitializer {

    @Bean
    @Order(1)
    CommandLineRunner initializeRoles(RoleRepository roleRepository) {

        return args -> {

            for (RoleName roleName : RoleName.values()) {

                if (!roleRepository.existsByName(roleName)) {

                    Role role = new Role();
                    role.setName(roleName);

                    roleRepository.save(role);
                }
            }
        };
    }
}