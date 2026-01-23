package com.dailygames.hub.controller;

import com.dailygames.hub.dto.AdminStatsResponse;
import com.dailygames.hub.model.GameType;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.ScoreRepository;
import com.dailygames.hub.repository.UserRepository;
import com.dailygames.hub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.dailygames.hub.util.DateUtils;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final UserRepository userRepository;
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

    @GetMapping("/stats/historical")
    public ResponseEntity<Map<String, Object>> getHistoricalStats(
            @RequestParam(defaultValue = "30") int days) {
        LocalDate endDate = DateUtils.todayAmsterdam();
        LocalDate startDate = endDate.minusDays(days - 1);

        Map<String, Object> response = new HashMap<>();

        // Daily active users for the period
        List<Map<String, Object>> dailyUsers = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            dayData.put("activeUsers", userRepository.countByLastActiveDate(date));
            dailyUsers.add(dayData);
        }
        response.put("dailyUsers", dailyUsers);

        // Games played per day
        List<Map<String, Object>> dailyGames = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            dayData.put("gamesPlayed", scoreRepository.countByGameDate(date));
            dailyGames.add(dayData);
        }
        response.put("dailyGames", dailyGames);

        // User growth (cumulative users by registration date)
        List<Map<String, Object>> userGrowth = new ArrayList<>();
        long cumulativeUsers = userRepository.countByCreatedAtBefore(startDate.atStartOfDay());
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            cumulativeUsers += userRepository.countByCreatedAtBetween(
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay()
            );
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            dayData.put("totalUsers", cumulativeUsers);
            userGrowth.add(dayData);
        }
        response.put("userGrowth", userGrowth);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/admins")
    public ResponseEntity<List<Map<String, Object>>> getAdmins() {
        List<User> admins = userRepository.findByIsAdminTrue();
        List<Map<String, Object>> response = admins.stream()
            .map(admin -> {
                Map<String, Object> adminData = new LinkedHashMap<>();
                adminData.put("id", admin.getId());
                adminData.put("username", admin.getUsername());
                adminData.put("displayName", admin.getDisplayName());
                adminData.put("email", admin.getEmail());
                adminData.put("isPrimaryAdmin", admin.getId() == 1L);
                return adminData;
            })
            .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admins/{userId}")
    public ResponseEntity<Map<String, String>> addAdmin(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (Boolean.TRUE.equals(user.getIsAdmin())) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "User is already an admin"));
        }
        user.setIsAdmin(true);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Admin added successfully"));
    }

    @DeleteMapping("/admins/{userId}")
    public ResponseEntity<Map<String, String>> removeAdmin(@PathVariable Long userId) {
        if (userId == 1L) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Cannot remove the primary admin"));
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!Boolean.TRUE.equals(user.getIsAdmin())) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "User is not an admin"));
        }
        user.setIsAdmin(false);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Admin removed successfully"));
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(
            @RequestParam String query) {
        List<User> users = userRepository.searchUsers(query);
        List<Map<String, Object>> response = users.stream()
            .limit(20)
            .map(user -> {
                Map<String, Object> userData = new LinkedHashMap<>();
                userData.put("id", user.getId());
                userData.put("username", user.getUsername());
                userData.put("displayName", user.getDisplayName());
                userData.put("isAdmin", user.getIsAdmin());
                return userData;
            })
            .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        long total = userRepository.count();
        List<User> users = userRepository.findAll(
            PageRequest.of(page, size, Sort.by("createdAt").descending())
        ).getContent();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("total", total);
        response.put("page", page);
        response.put("size", size);
        response.put("users", users.stream().map(user -> {
            Map<String, Object> userData = new LinkedHashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("displayName", user.getDisplayName());
            userData.put("email", user.getEmail());
            userData.put("isAdmin", user.getIsAdmin());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("lastActiveDate", user.getLastActiveDate());
            userData.put("globalDayStreak", user.getGlobalDayStreak());
            return userData;
        }).toList());

        return ResponseEntity.ok(response);
    }
}
