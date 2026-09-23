package com.yuvan.busbooking.user.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.user.dto.RoleRequest;
import com.yuvan.busbooking.user.dto.RoleResponse;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll()
                .stream()
                .map(RoleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoleResponse findById(Long id) {
        return RoleResponse.fromEntity(findOrThrow(id));
    }

    @Transactional
    public RoleResponse create(RoleRequest request) {
        if (roleRepository.existsByName(request.name())) {
            throw new IllegalArgumentException(
                    "Role already exists: " + request.name()
            );
        }

        Role role = new Role();
        role.setName(request.name());

        return RoleResponse.fromEntity(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse update(Long id, RoleRequest request) {
        Role role = findOrThrow(id);

        if (roleRepository.existsByName(request.name())
                && role.getName() != request.name()) {
            throw new IllegalArgumentException(
                    "Role already exists: " + request.name()
            );
        }

        role.setName(request.name());

        return RoleResponse.fromEntity(roleRepository.save(role));
    }

    @Transactional
    public void delete(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Role not found: " + id
            );
        }
        roleRepository.deleteById(id);
    }

    private Role findOrThrow(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found: " + id
                        )
                );
    }
}