package com.dailygames.hub.controller;

import com.dailygames.hub.config.JwtUtil;
import com.dailygames.hub.dto.AuthRequest;
import com.dailygames.hub.dto.AuthResponse;
import com.dailygames.hub.dto.RegisterRequest;
import com.dailygames.hub.model.User;
import com.dailygames.hub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getUsername(),
            user.getEmail(),
            user.getDisplayName()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userService.findByUsername(request.getUsername());
        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getUsername(),
            user.getEmail(),
            user.getDisplayName()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(new AuthResponse(
            null,
            user.getUsername(),
            user.getEmail(),
            user.getDisplayName()
        ));
    }
}
