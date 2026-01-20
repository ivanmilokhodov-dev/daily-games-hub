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

import java.util.List;
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
        response.setAverageRating(profileUser.getAverageRating());
        response.setIsOwnProfile(currentUser != null && currentUser.getId().equals(profileUser.getId()));

        // Get ratings
        List<RatingResponse> ratings = ratingService.getUserRatings(profileUser);
        response.setRatings(ratings);

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

        return response;
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
        response.setSubmittedAt(score.getSubmittedAt());
        return response;
    }
}
