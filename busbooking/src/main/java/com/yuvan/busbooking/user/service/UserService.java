package com.yuvan.busbooking.user.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.dto.UserRequest;
import com.yuvan.busbooking.user.dto.UserResponse;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse create(UserRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();

        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setStatus(
                request.status() != null
                        ? request.status()
                        : UserStatus.ACTIVE
        );

        return toResponse(userRepository.save(user));
    }

    public User createUser(UserRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();

        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setStatus(
                request.status() != null
                        ? request.status()
                        : UserStatus.ACTIVE
        );

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public User findMe() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                    .orElseThrow(
                        () -> new ResourceNotFoundException(
                            "User not found: " + email
                        )
                    );
        return user;
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + id
                        )
                );

        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        ));
    }

    public UserResponse update(Long id, UserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + id
                        )
                );

        if (!user.getEmail().equals(request.email())
                && userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());

        if (request.status() != null) {
            user.setStatus(request.status());
        }

        return toResponse(userRepository.save(user));
    }
    
    public UserResponse update(UserRequest request) {

        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                    .orElseThrow(
                        () -> new ResourceNotFoundException(
                            "User not found" + email
                        )
                    );

        if(!request.email().equals(user.getEmail()) && userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException(
                "Email already exists"
            );
        }
        
        user.setEmail(request.email());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        
        if(request.status() != null)
            user.setStatus(request.status());

        return toResponse(user);
        
    }

    public void delete(Long id) {

        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "User not found: " + id
            );
        }

        userRepository.deleteById(id);
    }

    private UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    /**
     * Save user entity directly (used for mobile verification updates)
     */
    public User saveUser(User user) {
        return userRepository.save(user);
    }
    
}