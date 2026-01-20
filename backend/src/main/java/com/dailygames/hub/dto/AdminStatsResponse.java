package com.dailygames.hub.dto;

import lombok.Data;
import java.util.Map;

@Data
public class AdminStatsResponse {
    private long totalUsers;
    private long activeToday;
    private long totalPlays;
    private long todayPlays;
    private Map<String, GameStatEntry> gameStats;
    private long maxPlays;
    private long maxTodayPlays;

    @Data
    public static class GameStatEntry {
        private String displayName;
        private long totalPlays;
        private long todayPlays;
    }
}
