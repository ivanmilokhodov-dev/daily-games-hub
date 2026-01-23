package com.dailygames.hub.controller;

import com.dailygames.hub.config.JwtUtil;
import com.dailygames.hub.dto.*;
import com.dailygames.hub.model.User;
import com.dailygames.hub.service.PasswordResetService;
import com.dailygames.hub.service.RatingService;
import com.dailygames.hub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordResetService passwordResetService;
    private final RatingService ratingService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        String token = jwtUtil.generateToken(user.getUsername(), Boolean.TRUE.equals(user.getIsAdmin()));
        int avgRating = calculateAverageRating(user);
        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getUsername(),
            user.getEmail(),
            user.getDisplayName(),
            user.getGlobalDayStreak(),
            avgRating,
            user.getIsAdmin()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userService.findByUsername(request.getUsername());
        String token = jwtUtil.generateToken(user.getUsername(), Boolean.TRUE.equals(user.getIsAdmin()));
        int avgRating = calculateAverageRating(user);
        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getUsername(),
            user.getEmail(),
            user.getDisplayName(),
            user.getGlobalDayStreak(),
            avgRating,
            user.getIsAdmin()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        int avgRating = calculateAverageRating(user);
        return ResponseEntity.ok(new AuthResponse(
            null,
            user.getUsername(),
            user.getEmail(),
            user.getDisplayName(),
            user.getGlobalDayStreak(),
            avgRating,
            user.getIsAdmin()
        ));
    }

    private int calculateAverageRating(User user) {
        var ratings = ratingService.getUserRatings(user);
        return (int) ratings.stream()
            .mapToInt(RatingResponse::getRating)
            .average()
            .orElse(1000);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.createPasswordResetToken(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "Password reset link sent to your email"));
        } catch (IllegalArgumentException e) {
            // Don't reveal if email exists or not for security
            return ResponseEntity.ok(Map.of("message", "If this email is registered, you will receive a password reset link"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<Map<String, Boolean>> validateResetToken(@RequestParam String token) {
        boolean valid = passwordResetService.isValidToken(token);
        return ResponseEntity.ok(Map.of("valid", valid));
    }
}
