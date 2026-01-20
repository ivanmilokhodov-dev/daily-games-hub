package com.dailygames.hub.controller;

import com.dailygames.hub.dto.PasswordChangeRequest;
import com.dailygames.hub.dto.ProfileUpdateRequest;
import com.dailygames.hub.dto.AuthResponse;
import com.dailygames.hub.model.User;
import com.dailygames.hub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            Authentication authentication,
            @RequestBody ProfileUpdateRequest request) {
        User user = userService.findByUsername(authentication.getName());
        User updated = userService.updateProfile(user, request.getDisplayName(), request.getEmail());

        return ResponseEntity.ok(new AuthResponse(
            null,
            updated.getUsername(),
            updated.getEmail(),
            updated.getDisplayName(),
            updated.getGlobalDayStreak(),
            updated.getAverageRating()
        ));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordChangeRequest request) {
        User user = userService.findByUsername(authentication.getName());
        try {
            userService.changePassword(user, request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).build();
        }
    }
}
