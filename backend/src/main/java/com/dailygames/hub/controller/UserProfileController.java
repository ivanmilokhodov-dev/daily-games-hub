package com.dailygames.hub.controller;

import com.dailygames.hub.dto.UserProfileResponse;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.UserRepository;
import com.dailygames.hub.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final UserRepository userRepository;

    @GetMapping("/profile/{username}")
    public ResponseEntity<UserProfileResponse> getProfileByUsername(
            Authentication auth,
            @PathVariable String username) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(userProfileService.getProfile(currentUser, username));
    }

    @GetMapping("/profile/id/{userId}")
    public ResponseEntity<UserProfileResponse> getProfileById(
            Authentication auth,
            @PathVariable Long userId) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(userProfileService.getProfileById(currentUser, userId));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getOwnProfile(Authentication auth) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(userProfileService.getProfile(currentUser, currentUser.getUsername()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserProfileResponse>> searchUsers(
            Authentication auth,
            @RequestParam String q) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(userProfileService.searchUsers(currentUser, q));
    }
}
