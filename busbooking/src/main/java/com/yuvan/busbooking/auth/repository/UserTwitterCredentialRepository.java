package com.yuvan.busbooking.auth.repository;

import com.yuvan.busbooking.auth.entity.UserTwitterCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Twitter OAuth credential records.
 *
 * <p>Lookup is always by {@code twitterId} (the stable numeric ID assigned by Twitter),
 * never by username, which the user is free to change at any time.</p>
 */
@Repository
public interface UserTwitterCredentialRepository extends JpaRepository<UserTwitterCredential, Long> {

    /** Find by Twitter's stable numeric user ID. */
    Optional<UserTwitterCredential> findByTwitterId(String twitterId);

    /** Check whether a credential for a given Twitter ID already exists. */
    boolean existsByTwitterId(String twitterId);

    /** Find by the linked local user's primary key. */
    Optional<UserTwitterCredential> findByUserId(Long userId);
}
