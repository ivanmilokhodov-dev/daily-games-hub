package com.dailygames.hub.controller;

import com.dailygames.hub.dto.ScoreRequest;
import com.dailygames.hub.dto.ScoreResponse;
import com.dailygames.hub.model.User;
import com.dailygames.hub.service.FriendGroupService;
import com.dailygames.hub.service.ScoreService;
import com.dailygames.hub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.dailygames.hub.util.DateUtils;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;
    private final UserService userService;
    private final FriendGroupService friendGroupService;

    @PostMapping
    public ResponseEntity<ScoreResponse> submitScore(
            @Valid @RequestBody ScoreRequest request,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        ScoreResponse response = scoreService.submitScore(user, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ScoreResponse>> getMyScores(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(scoreService.getUserScores(user));
    }

    @GetMapping("/today")
    public ResponseEntity<List<ScoreResponse>> getTodayScores() {
        return ResponseEntity.ok(scoreService.getScoresForDate(DateUtils.todayAmsterdam()));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<ScoreResponse>> getScoresByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(scoreService.getScoresForDate(date));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ScoreResponse>> getGroupScores(
            @PathVariable Long groupId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        LocalDate queryDate = date != null ? date : DateUtils.todayAmsterdam();
        List<User> members = friendGroupService.getGroupMembers(groupId);
        return ResponseEntity.ok(scoreService.getGroupScoresForDate(members, queryDate));
    }
}
