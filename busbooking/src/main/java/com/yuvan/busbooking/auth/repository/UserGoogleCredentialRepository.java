package com.yuvan.busbooking.auth.repository;

import com.yuvan.busbooking.auth.entity.UserGoogleCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserGoogleCredentialRepository extends JpaRepository<UserGoogleCredential, Long> {
    Optional<UserGoogleCredential> findByGoogleSub(String googleSub);
    Optional<UserGoogleCredential> findByUserId(Long userId);
}
