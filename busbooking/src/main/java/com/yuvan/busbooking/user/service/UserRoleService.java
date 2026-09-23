package com.yuvan.busbooking.user.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.user.dto.UserRoleRequest;
import com.yuvan.busbooking.user.dto.UserRoleResponse;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserRoleService {

    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserRoleService(
            UserRoleRepository userRoleRepository,
            UserRepository userRepository,
            RoleRepository roleRepository
    ) {
        this.userRoleRepository = userRoleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<UserRoleResponse> findAll() {
        return userRoleRepository.findAll()
                .stream()
                .map(UserRoleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserRoleResponse> findByUser(Long userId) {
        return userRoleRepository.findByUserId(userId)
                .stream()
                .map(UserRoleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserRoleResponse findById(Long id) {
        return UserRoleResponse.fromEntity(findOrThrow(id));
    }

    @Transactional
    public UserRoleResponse create(UserRoleRequest request) {

        User user = userRepository.findById(request.userId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + request.userId()
                        )
                );

        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found: " + request.roleId()
                        )
                );

        if (userRoleRepository.existsByUserIdAndRoleId(
                request.userId(),
                request.roleId()
        )) {
            throw new IllegalArgumentException(
                    "This role is already assigned to the user"
            );
        }

        UserRole userRole = new UserRole();

        userRole.setUser(user);
        userRole.setRole(role);

        return UserRoleResponse.fromEntity(
                userRoleRepository.save(userRole)
        );
    }

    @Transactional
    public UserRoleResponse update(
            Long id,
            UserRoleRequest request
    ) {

        UserRole userRole = findOrThrow(id);

        User user = userRepository.findById(request.userId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + request.userId()
                        )
                );

        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found: " + request.roleId()
                        )
                );

        userRole.setUser(user);
        userRole.setRole(role);

        return UserRoleResponse.fromEntity(
                userRoleRepository.save(userRole)
        );
    }

    @Transactional
    public void delete(Long id) {
        if (!userRoleRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "User role not found: " + id
            );
        }
        userRoleRepository.deleteById(id);
    }

    private UserRole findOrThrow(Long id) {
        return userRoleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User role not found: " + id
                        )
                );
    }
}