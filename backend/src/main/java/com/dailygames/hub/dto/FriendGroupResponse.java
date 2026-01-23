package com.dailygames.hub.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FriendGroupResponse {
    private Long id;
    private String name;
    private String inviteCode;
    private String ownerUsername;
    private Long ownerId;
    private List<MemberInfo> members;
    private Integer memberCount;
    private LocalDateTime createdAt;
    private Integer groupStreak;
    private Integer longestGroupStreak;
    private GroupStats stats;

    @Data
    public static class MemberInfo {
        private Long id;
        private String username;
        private String displayName;
        private Integer globalDayStreak;
        private Integer averageRating;
        private LocalDateTime joinedAt;
    }

    @Data
    public static class GroupStats {
        private String mostActiveToday;
        private Integer mostActiveTodayGames;
        private String longestStreak;
        private Integer longestStreakDays;
        private String returningPlayer;
        private Integer totalGamesToday;
    }
}
