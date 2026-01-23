package com.dailygames.hub.controller;

import com.dailygames.hub.dto.AdminStatsResponse;
import com.dailygames.hub.model.GameType;
import com.dailygames.hub.repository.ScoreRepository;
import com.dailygames.hub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dailygames.hub.util.DateUtils;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final ScoreRepository scoreRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        LocalDate today = DateUtils.todayAmsterdam();

        AdminStatsResponse response = new AdminStatsResponse();
        response.setTotalUsers(userService.countUsers());
        response.setActiveToday(userService.countActiveToday(today));
        response.setTotalPlays(scoreRepository.count());
        response.setTodayPlays(scoreRepository.countByGameDate(today));

        Map<String, AdminStatsResponse.GameStatEntry> gameStats = new LinkedHashMap<>();
        long maxPlays = 0;
        long maxTodayPlays = 0;

        for (GameType gameType : GameType.values()) {
            AdminStatsResponse.GameStatEntry entry = new AdminStatsResponse.GameStatEntry();
            entry.setDisplayName(gameType.getDisplayName());
            entry.setTotalPlays(scoreRepository.countByGameType(gameType));
            entry.setTodayPlays(scoreRepository.countByGameTypeAndGameDate(gameType, today));

            if (entry.getTotalPlays() > maxPlays) {
                maxPlays = entry.getTotalPlays();
            }
            if (entry.getTodayPlays() > maxTodayPlays) {
                maxTodayPlays = entry.getTodayPlays();
            }

            gameStats.put(gameType.name(), entry);
        }

        response.setGameStats(gameStats);
        response.setMaxPlays(maxPlays > 0 ? maxPlays : 1);
        response.setMaxTodayPlays(maxTodayPlays > 0 ? maxTodayPlays : 1);

        return ResponseEntity.ok(response);
    }
}
