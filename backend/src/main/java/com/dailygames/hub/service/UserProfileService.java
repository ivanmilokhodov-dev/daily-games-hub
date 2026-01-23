package com.dailygames.hub.service;

import com.dailygames.hub.dto.RatingResponse;
import com.dailygames.hub.dto.ScoreResponse;
import com.dailygames.hub.dto.UserProfileResponse;
import com.dailygames.hub.model.Rating;
import com.dailygames.hub.model.Score;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.RatingRepository;
import com.dailygames.hub.repository.ScoreRepository;
import com.dailygames.hub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.dailygames.hub.util.DateUtils;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;
    private final ScoreRepository scoreRepository;
    private final FriendshipService friendshipService;
    private final RatingService ratingService;

    public UserProfileResponse getProfile(User currentUser, String username) {
        User profileUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return buildProfileResponse(currentUser, profileUser);
    }

    public UserProfileResponse getProfileById(User currentUser, Long userId) {
        User profileUser = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return buildProfileResponse(currentUser, profileUser);
    }

    public List<UserProfileResponse> searchUsers(User currentUser, String query) {
        // Simple search by username or display name
        return userRepository.findAll().stream()
            .filter(u -> !u.getId().equals(currentUser.getId()))
            .filter(u -> u.getUsername().toLowerCase().contains(query.toLowerCase()) ||
                        (u.getDisplayName() != null && u.getDisplayName().toLowerCase().contains(query.toLowerCase())))
            .limit(20)
            .map(u -> buildProfileResponse(currentUser, u))
            .collect(Collectors.toList());
    }

    private UserProfileResponse buildProfileResponse(User currentUser, User profileUser) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(profileUser.getId());
        response.setUsername(profileUser.getUsername());
        response.setDisplayName(profileUser.getDisplayName());
        response.setCreatedAt(profileUser.getCreatedAt());
        response.setGlobalDayStreak(profileUser.getGlobalDayStreak());
        response.setLongestGlobalStreak(profileUser.getLongestGlobalStreak());
        response.setLastActiveDate(profileUser.getLastActiveDate());
        response.setIsOwnProfile(currentUser != null && currentUser.getId().equals(profileUser.getId()));

        // Get ratings (includes all games, unplayed ones have default 1000 rating)
        List<RatingResponse> ratings = ratingService.getUserRatings(profileUser);
        response.setRatings(ratings);

        // Calculate average rating dynamically from all games (including unplayed at 1000)
        int avgRating = (int) ratings.stream()
            .mapToInt(RatingResponse::getRating)
            .average()
            .orElse(1000);
        response.setAverageRating(avgRating);

        // Calculate total games played
        int totalGames = ratings.stream()
            .mapToInt(RatingResponse::getGamesPlayed)
            .sum();
        response.setTotalGamesPlayed(totalGames);

        // Get recent scores (limit to 20)
        List<Score> recentScores = scoreRepository.findRecentByUser(profileUser.getId());
        response.setRecentScores(recentScores.stream()
            .limit(20)
            .map(this::mapScoreToResponse)
            .collect(Collectors.toList()));

        // Get friendship status
        if (currentUser != null && !currentUser.getId().equals(profileUser.getId())) {
            response.setFriendshipStatus(friendshipService.getFriendshipStatus(currentUser, profileUser));
        }

        // Calculate rating history (daily average rating)
        response.setRatingHistory(calculateRatingHistory(recentScores, avgRating));

        return response;
    }

    private List<UserProfileResponse.RatingHistoryPoint> calculateRatingHistory(List<Score> scores, int currentRating) {
        if (scores.isEmpty()) {
            return Collections.emptyList();
        }

        // Sort scores by date ascending for calculation
        List<Score> sortedScores = scores.stream()
            .sorted(Comparator.comparing(Score::getGameDate).thenComparing(Score::getSubmittedAt))
            .collect(Collectors.toList());

        // Group by date and calculate cumulative rating change per day
        Map<LocalDate, Integer> dailyRatingChange = new LinkedHashMap<>();
        for (Score score : sortedScores) {
            if (score.getRatingChange() != null) {
                dailyRatingChange.merge(score.getGameDate(), score.getRatingChange(), Integer::sum);
            }
        }

        // Build rating history by working backwards from current rating
        List<UserProfileResponse.RatingHistoryPoint> history = new ArrayList<>();
        int rating = currentRating;

        // Work backwards through the dates
        List<LocalDate> dates = new ArrayList<>(dailyRatingChange.keySet());
        Collections.reverse(dates);

        // First add current rating
        if (!dates.isEmpty()) {
            UserProfileResponse.RatingHistoryPoint currentPoint = new UserProfileResponse.RatingHistoryPoint();
            currentPoint.setDate(DateUtils.todayAmsterdam());
            currentPoint.setRating(rating);
            history.add(0, currentPoint);

            // Work backwards
            for (LocalDate date : dates) {
                if (!date.equals(DateUtils.todayAmsterdam())) {
                    rating -= dailyRatingChange.get(date);
                    UserProfileResponse.RatingHistoryPoint point = new UserProfileResponse.RatingHistoryPoint();
                    point.setDate(date);
                    point.setRating(rating);
                    history.add(0, point);
                }
            }
        }

        // Limit to last 30 entries
        if (history.size() > 30) {
            history = history.subList(history.size() - 30, history.size());
        }

        return history;
    }

    private ScoreResponse mapScoreToResponse(Score score) {
        ScoreResponse response = new ScoreResponse();
        response.setId(score.getId());
        response.setUsername(score.getUser().getUsername());
        response.setDisplayName(score.getUser().getDisplayName());
        response.setGameType(score.getGameType());
        response.setGameDisplayName(score.getGameType().getDisplayName());
        response.setGameDate(score.getGameDate());
        response.setRawResult(score.getRawResult());
        response.setAttempts(score.getAttempts());
        response.setSolved(score.getSolved());
        response.setScore(score.getScore());
        response.setTimeSeconds(score.getTimeSeconds());
        response.setRatingChange(score.getRatingChange());
        response.setSubmittedAt(score.getSubmittedAt());
        return response;
    }
}
