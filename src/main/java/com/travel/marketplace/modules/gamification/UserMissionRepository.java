package com.travel.marketplace.modules.gamification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserMissionRepository extends JpaRepository<UserMission, Long> {
    Optional<UserMission> findByUserIdAndMissionId(Long userId, String missionId);
    boolean existsByUserIdAndMissionId(Long userId, String missionId);
    java.util.List<UserMission> findByUserId(Long userId);
}
