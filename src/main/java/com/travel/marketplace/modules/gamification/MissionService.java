package com.travel.marketplace.modules.gamification;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.payment.dto.AiCoinCreditResult;
import com.travel.marketplace.modules.payment.service.AiCoinWalletService;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MissionService {

    private final UserMissionRepository userMissionRepository;
    private final UserRepository userRepository;
    private final AiCoinWalletService aiCoinWalletService;
    private final MissionRegistry missionRegistry;

    @Transactional
    public MissionClaimResponse claimMission(Long userId, MissionClaimRequest request) {
        String missionId = request.getMissionId();
        long rewardCoins = request.getRewardCoins();
        long rewardExp = request.getRewardExp();

        if (userMissionRepository.existsByUserIdAndMissionId(userId, missionId)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "MISSION_ALREADY_CLAIMED");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        UserMission userMission = UserMission.builder()
                .user(user)
                .missionId(missionId)
                .status("CLAIMED")
                .rewardCoins((int) rewardCoins)
                .rewardExp((int) rewardExp)
                .claimedAt(LocalDateTime.now())
                .build();

        userMission = userMissionRepository.saveAndFlush(userMission);

        user.setSeasonExp(user.getSeasonExp() + (int) rewardExp);

        if ("daily-login".equals(missionId)) {
            updateLoginStreak(user);
        }

        userRepository.save(user);

        String idempotencyKey = "CLAIM_MISSION_USER_MISSION_ID_" + userMission.getId();
        AiCoinCreditResult creditResult = aiCoinWalletService.creditMissionReward(userId, missionId, rewardCoins, idempotencyKey);

        return MissionClaimResponse.builder()
                .missionId(missionId)
                .latestAiCoinBalance(creditResult.getBalance())
                .latestSeasonExp(user.getSeasonExp())
                .status("CLAIMED")
                .claimed(true)
                .message("Mission claimed successfully")
                .build();
    }

    private void updateLoginStreak(User user) {
        Instant now = Instant.now();
        if (user.getLastLoginDate() == null) {
            user.setLoginStreakDays(1);
        } else {
            LocalDate lastLoginDate = user.getLastLoginDate().atZone(ZoneId.systemDefault()).toLocalDate();
            LocalDate today = now.atZone(ZoneId.systemDefault()).toLocalDate();
            long daysBetween = ChronoUnit.DAYS.between(lastLoginDate, today);

            if (daysBetween == 1) {
                user.setLoginStreakDays(user.getLoginStreakDays() + 1);
            } else if (daysBetween > 1) {
                user.setLoginStreakDays(1);
            }
        }
        user.setLastLoginDate(now);
    }

    @Transactional
    public List<MissionStatusResponse> getUserMissions(Long userId) {
        List<UserMission> missions = userMissionRepository.findByUserId(userId);
        List<MissionStatusResponse> activeMissions = new java.util.ArrayList<>();

        for (UserMission mission : missions) {
            MissionResetType resetType = missionRegistry.getResetTypeForMission(mission.getMissionId());
            if (missionRegistry.shouldReset(resetType, mission.getUpdatedAt())) {
                userMissionRepository.delete(mission);
                log.info("Resetting mission {} for user {}", mission.getMissionId(), userId);
                continue;
            }

            activeMissions.add(MissionStatusResponse.builder()
                    .missionId(mission.getMissionId())
                    .status(mission.getStatus())
                    .claimed("CLAIMED".equals(mission.getStatus()))
                    .build());
        }

        return activeMissions;
    }

    @Transactional(readOnly = true)
    public MissionDashboardSummaryResponse getMissionDashboardSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        List<UserMission> missions = userMissionRepository.findByUserId(userId);
        int completedMissions = (int) missions.stream()
                .filter(m -> "CLAIMED".equals(m.getStatus()))
                .count();

        LocalDate todayDate = LocalDate.now();
        int todayEarnedCoins = missions.stream()
                .filter(m -> "CLAIMED".equals(m.getStatus()) && m.getClaimedAt() != null && m.getClaimedAt().toLocalDate().equals(todayDate))
                .mapToInt(UserMission::getRewardCoins)
                .sum();

        // Calculate season level dynamically from EXP.
        // E.g. milestones are 5, 10, 15, 20, 30, 50
        // max EXP target 5000.
        int seasonExp = user.getSeasonExp();
        int seasonLevel = (seasonExp / 100) + 1;
        if (seasonLevel > 50) {
            seasonLevel = 50;
        }

        // Hardcode a season end date 30 days from now for demo, or end of month.
        // Here we just set it to end of current month.
        LocalDateTime endOfMonth = LocalDateTime.now().with(java.time.temporal.TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59);
        Instant seasonEndDate = endOfMonth.atZone(ZoneId.systemDefault()).toInstant();

        // Check if streak needs reset (if missed yesterday)
        int validStreak = user.getLoginStreakDays();
        if (user.getLastLoginDate() != null) {
            LocalDate lastLoginDate = user.getLastLoginDate().atZone(ZoneId.systemDefault()).toLocalDate();
            LocalDate today = LocalDate.now();
            if (ChronoUnit.DAYS.between(lastLoginDate, today) > 1) {
                validStreak = 0;
            }
        }

        return MissionDashboardSummaryResponse.builder()
                .goldCoins(user.getAiCoinBalance())
                .todayEarnedCoins(todayEarnedCoins)
                .seasonExp(seasonExp)
                .seasonExpTarget(5000)
                .seasonLevel(seasonLevel)
                .completedMissions(completedMissions)
                .totalMissions(68)
                .loginStreakDays(validStreak)
                .seasonEndDate(seasonEndDate)
                .build();
    }
}
