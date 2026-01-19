package com.dailygames.hub.controller;

import com.dailygames.hub.model.Streak;
import com.dailygames.hub.model.User;
import com.dailygames.hub.service.StreakService;
import com.dailygames.hub.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/streaks")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;
    private final UserService userService;

    @GetMapping("/my")
    public ResponseEntity<List<StreakResponse>> getMyStreaks(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        List<StreakResponse> streaks = streakService.getUserStreaks(user).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(streaks);
    }

    private StreakResponse mapToResponse(Streak streak) {
        StreakResponse response = new StreakResponse();
        response.setGameType(streak.getGameType().name());
        response.setGameDisplayName(streak.getGameType().getDisplayName());
        response.setCurrentStreak(streak.getCurrentStreak());
        response.setLongestStreak(streak.getLongestStreak());
        response.setLastPlayedDate(streak.getLastPlayedDate());
        return response;
    }

    @Data
    public static class StreakResponse {
        private String gameType;
        private String gameDisplayName;
        private Integer currentStreak;
        private Integer longestStreak;
        private LocalDate lastPlayedDate;
    }
}
