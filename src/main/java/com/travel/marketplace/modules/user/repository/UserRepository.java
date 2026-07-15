package com.travel.marketplace.modules.user.repository;

import com.travel.marketplace.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    long countByIsActiveTrue();

    long countByBannedAtIsNotNull();

    long countByCreatedAtGreaterThanEqual(Instant since);

    @Query("select count(distinct u) from User u join u.roles r where r.name = :roleName")
    long countByRoleName(@Param("roleName") String roleName);

    @Query("select count(distinct u) from User u join u.roles r where r.name = 'ROLE_ADMIN' and u.isActive = true and u.bannedAt is null")
    long countActiveAdmins();

    @Query("select count(distinct u) from User u left join u.roles r left join u.providerProfile p where p.id is not null or r.name like 'ROLE_PROVIDER_%'")
    long countProviders();

    @Query("select count(distinct u) from User u left join u.roles r left join u.providerProfile p where p.verificationStatus = com.travel.marketplace.modules.provider.enums.VerificationStatus.APPROVED or r.name = 'ROLE_ADMIN'")
    long countVerifiedUsers();

    @Query(value = """
            select date(u.created_at) as day, count(u.id) as total
            from users u
            where u.created_at >= :from
              and u.created_at < :to
            group by date(u.created_at)
            order by day
            """, nativeQuery = true)
    List<Object[]> countUsersCreatedByDay(@Param("from") Instant from, @Param("to") Instant to);

    long countByCreatedAtBefore(Instant before);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant to);
}
