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

import java.time.LocalDateTime;

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

    @Transactional
    public java.util.List<MissionStatusResponse> getUserMissions(Long userId) {
        java.util.List<UserMission> missions = userMissionRepository.findByUserId(userId);
        java.util.List<MissionStatusResponse> activeMissions = new java.util.ArrayList<>();

        for (UserMission mission : missions) {
            MissionResetType resetType = missionRegistry.getResetTypeForMission(mission.getMissionId());
            // Use updatedAt as the last completion timestamp (since we save when claiming)
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
}
