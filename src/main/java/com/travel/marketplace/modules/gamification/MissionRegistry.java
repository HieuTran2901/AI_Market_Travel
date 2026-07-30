package com.travel.marketplace.modules.gamification;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.IsoFields;

@Component
public class MissionRegistry {

    public MissionResetType getResetTypeForMission(String missionId) {
        if (missionId == null) {
            return MissionResetType.NONE;
        }
        
        if (missionId.startsWith("daily-")) {
            return MissionResetType.DAILY;
        }
        if (missionId.startsWith("weekly-")) {
            return MissionResetType.WEEKLY;
        }
        if (missionId.startsWith("monthly-")) {
            return MissionResetType.MONTHLY;
        }
        if (missionId.startsWith("event-")) {
            return MissionResetType.EVENT;
        }
        
        return MissionResetType.NONE;
    }

    public boolean shouldReset(MissionResetType resetType, LocalDateTime lastCompletedAt) {
        if (resetType == null || resetType == MissionResetType.NONE || lastCompletedAt == null) {
            return false;
        }

        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
        ZonedDateTime completedUtc = lastCompletedAt.atZone(ZoneOffset.UTC); // Assuming DB stores in UTC, or we treat it as UTC for global resets

        switch (resetType) {
            case DAILY:
                return nowUtc.toLocalDate().isAfter(completedUtc.toLocalDate());
                
            case WEEKLY:
                // Check if the current year/week is different from completed year/week
                int currentWeek = nowUtc.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
                int completedWeek = completedUtc.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
                int currentYear = nowUtc.get(IsoFields.WEEK_BASED_YEAR);
                int completedYear = completedUtc.get(IsoFields.WEEK_BASED_YEAR);
                
                return currentYear > completedYear || (currentYear == completedYear && currentWeek > completedWeek);
                
            case MONTHLY:
                return nowUtc.getYear() > completedUtc.getYear() || 
                       (nowUtc.getYear() == completedUtc.getYear() && nowUtc.getMonthValue() > completedUtc.getMonthValue());
                       
            case EVENT:
                // Specific event logic could be added here, for now it doesn't automatically time-reset
                // unless explicitly programmed for a specific event timeline.
                return false;
                
            default:
                return false;
        }
    }
}
