package com.yuvan.busbooking.user.repository;

import com.yuvan.busbooking.user.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByUserId(Long userId);

    @Query("""
        SELECT ur FROM UserRole ur
        JOIN FETCH ur.role
        WHERE ur.user.id = :userId
    """)
    List<UserRole> findByUserIdWithRoles(Long userId);
    boolean existsByUserIdAndRoleId(Long userId, Long roleId);
}