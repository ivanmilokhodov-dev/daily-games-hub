package com.dailygames.hub.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserProfileResponse {
    private Long id;
    private String username;
    private String displayName;
    private LocalDateTime createdAt;
    private Integer globalDayStreak;
    private Integer longestGlobalStreak;
    private LocalDate lastActiveDate;
    private Integer averageRating;
    private List<RatingResponse> ratings;
    private List<ScoreResponse> recentScores;
    private Integer totalGamesPlayed;
    private String friendshipStatus; // null, PENDING, ACCEPTED, SENT
    private Boolean isOwnProfile;
    private List<RatingHistoryPoint> ratingHistory;

    @Data
    public static class RatingHistoryPoint {
        private LocalDate date;
        private Integer rating;
    }
}
