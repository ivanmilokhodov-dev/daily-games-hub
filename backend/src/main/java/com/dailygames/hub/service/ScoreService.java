package com.dailygames.hub.service;

import com.dailygames.hub.dto.ScoreRequest;
import com.dailygames.hub.dto.ScoreResponse;
import com.dailygames.hub.model.*;
import com.dailygames.hub.repository.FriendGroupRepository;
import com.dailygames.hub.repository.ScoreRepository;
import com.dailygames.hub.repository.StreakRepository;
import com.dailygames.hub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final StreakRepository streakRepository;
    private final UserRepository userRepository;
    private final FriendGroupRepository friendGroupRepository;
    private final RatingService ratingService;

    @Transactional
    public ScoreResponse submitScore(User user, ScoreRequest request) {
        LocalDate gameDate = request.getGameDate() != null ? request.getGameDate() : LocalDate.now();

        // Check if user already submitted for this game today
        if (scoreRepository.findByUserAndGameTypeAndGameDate(user, request.getGameType(), gameDate).isPresent()) {
            throw new IllegalArgumentException("You have already submitted a score for this game today");
        }

        Score score = new Score();
        score.setUser(user);
        score.setGameType(request.getGameType());
        score.setGameDate(gameDate);
        score.setRawResult(request.getRawResult());
        score.setAttempts(request.getAttempts());
        score.setSolved(request.getSolved());
        score.setScore(request.getScore());
        score.setTimeSeconds(request.getTimeSeconds());

        Score saved = scoreRepository.save(score);

        // Update game-specific streak
        updateStreak(user, request.getGameType(), gameDate);

        // Update global day streak
        updateGlobalDayStreak(user, gameDate);

        // Update rating
        ratingService.updateRating(user, request.getGameType(),
            Boolean.TRUE.equals(request.getSolved()),
            request.getAttempts() != null ? request.getAttempts() : 1,
            request.getScore());

        // Update group streaks for all groups the user is in
        updateGroupStreaks(user, gameDate);

        return mapToResponse(saved);
    }

    private void updateGroupStreaks(User user, LocalDate gameDate) {
        List<FriendGroup> userGroups = friendGroupRepository.findByMember(user);
        for (FriendGroup group : userGroups) {
            LocalDate lastActive = group.getLastActiveDate();

            if (lastActive == null) {
                group.setGroupStreak(1);
                group.setLongestGroupStreak(1);
            } else if (lastActive.equals(gameDate)) {
                // Already counted for today
                continue;
            } else if (lastActive.plusDays(1).equals(gameDate)) {
                // Consecutive day
                group.setGroupStreak(group.getGroupStreak() + 1);
                if (group.getGroupStreak() > group.getLongestGroupStreak()) {
                    group.setLongestGroupStreak(group.getGroupStreak());
                }
            } else {
                // Streak broken
                group.setGroupStreak(1);
            }

            group.setLastActiveDate(gameDate);
            friendGroupRepository.save(group);
        }
    }

    private void updateGlobalDayStreak(User user, LocalDate gameDate) {
        LocalDate lastActive = user.getLastActiveDate();

        if (lastActive == null) {
            // First game ever
            user.setGlobalDayStreak(1);
            user.setLongestGlobalStreak(1);
        } else if (lastActive.equals(gameDate)) {
            // Already played today, no change to streak
            return;
        } else if (lastActive.plusDays(1).equals(gameDate)) {
            // Consecutive day
            user.setGlobalDayStreak(user.getGlobalDayStreak() + 1);
            if (user.getGlobalDayStreak() > user.getLongestGlobalStreak()) {
                user.setLongestGlobalStreak(user.getGlobalDayStreak());
            }
        } else {
            // Streak broken
            user.setGlobalDayStreak(1);
        }

        user.setLastActiveDate(gameDate);
        userRepository.save(user);
    }

    private void updateStreak(User user, GameType gameType, LocalDate gameDate) {
        Streak streak = streakRepository.findByUserAndGameType(user, gameType)
            .orElseGet(() -> {
                Streak newStreak = new Streak();
                newStreak.setUser(user);
                newStreak.setGameType(gameType);
                newStreak.setCurrentStreak(0);
                newStreak.setLongestStreak(0);
                return newStreak;
            });

        LocalDate lastPlayed = streak.getLastPlayedDate();

        if (lastPlayed == null || lastPlayed.plusDays(1).equals(gameDate)) {
            // Continuing or starting streak
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
            if (streak.getCurrentStreak() > streak.getLongestStreak()) {
                streak.setLongestStreak(streak.getCurrentStreak());
            }
        } else if (!lastPlayed.equals(gameDate)) {
            // Streak broken, start new one
            streak.setCurrentStreak(1);
        }

        streak.setLastPlayedDate(gameDate);
        streakRepository.save(streak);
    }

    public List<ScoreResponse> getScoresForDate(LocalDate date) {
        return scoreRepository.findByGameDateOrderBySubmittedAtDesc(date).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public List<ScoreResponse> getUserScores(User user) {
        return scoreRepository.findRecentByUser(user.getId()).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public List<ScoreResponse> getGroupScoresForDate(List<User> members, LocalDate date) {
        return scoreRepository.findByUsersAndDate(members, date).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private ScoreResponse mapToResponse(Score score) {
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
