package com.dailygames.hub.controller;

import com.dailygames.hub.config.JwtUtil;
import com.dailygames.hub.dto.AuthRequest;
import com.dailygames.hub.dto.RegisterRequest;
import com.dailygames.hub.model.User;
import com.dailygames.hub.service.PasswordResetService;
import com.dailygames.hub.service.RatingService;
import com.dailygames.hub.service.UserService;
import com.dailygames.hub.dto.RatingResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.context.annotation.Import;
import com.dailygames.hub.config.SecurityConfig;
import com.dailygames.hub.config.JwtAuthFilter;

import java.util.List;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private PasswordResetService passwordResetService;

    @MockBean
    private RatingService ratingService;

    @MockBean
    private UserDetailsService userDetailsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setDisplayName("Test User");
        testUser.setGlobalDayStreak(5);
        testUser.setAverageRating(1200);

        // Mock rating service to return default ratings (average 1000)
        RatingResponse defaultRating = new RatingResponse();
        defaultRating.setRating(1000);
        when(ratingService.getUserRatings(any(User.class))).thenReturn(List.of(defaultRating));
    }

    @Test
    @DisplayName("Should register user successfully")
    void register_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password123");
        request.setDisplayName("New User");

        User newUser = new User();
        newUser.setId(2L);
        newUser.setUsername("newuser");
        newUser.setEmail("new@example.com");
        newUser.setDisplayName("New User");
        newUser.setGlobalDayStreak(0);
        newUser.setAverageRating(1000);

        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(newUser);
        when(jwtUtil.generateToken(eq("newuser"), eq(false))).thenReturn("jwt-token");

        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("jwt-token"))
            .andExpect(jsonPath("$.username").value("newuser"))
            .andExpect(jsonPath("$.email").value("new@example.com"));
    }

    @Test
    @DisplayName("Should login user successfully")
    void login_Success() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(auth);
        when(userService.findByUsername("testuser")).thenReturn(testUser);
        when(jwtUtil.generateToken(eq("testuser"), eq(false))).thenReturn("jwt-token");

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("jwt-token"))
            .andExpect(jsonPath("$.username").value("testuser"))
            .andExpect(jsonPath("$.globalDayStreak").value(5));
    }

    @Test
    @DisplayName("Should handle forgot password request")
    void forgotPassword_Success() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Should reject invalid registration data")
    void register_InvalidData() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername(""); // Invalid - empty username
        request.setEmail("invalid-email"); // Invalid email format
        request.setPassword("123"); // Too short

        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }
}
