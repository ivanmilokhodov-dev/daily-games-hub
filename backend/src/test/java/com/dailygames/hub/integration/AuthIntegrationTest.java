package com.dailygames.hub.integration;

import com.dailygames.hub.dto.AuthRequest;
import com.dailygames.hub.dto.RegisterRequest;
import com.dailygames.hub.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should complete full registration and login flow")
    void fullAuthFlow() throws Exception {
        // Register a new user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("integrationuser");
        registerRequest.setEmail("integration@test.com");
        registerRequest.setPassword("password123");
        registerRequest.setDisplayName("Integration User");

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.username").value("integrationuser"))
            .andReturn();

        // Verify user was created in database
        assertThat(userRepository.findByUsername("integrationuser")).isPresent();

        // Login with the same credentials
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setUsername("integrationuser");
        loginRequest.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.username").value("integrationuser"))
            .andReturn();

        // Extract token and access protected endpoint
        String responseBody = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("integrationuser"))
            .andExpect(jsonPath("$.email").value("integration@test.com"));
    }

    @Test
    @DisplayName("Should reject duplicate username")
    void registerDuplicateUsername() throws Exception {
        // Register first user
        RegisterRequest request1 = new RegisterRequest();
        request1.setUsername("duplicate");
        request1.setEmail("first@test.com");
        request1.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request1)))
            .andExpect(status().isOk());

        // Try to register with same username
        RegisterRequest request2 = new RegisterRequest();
        request2.setUsername("duplicate");
        request2.setEmail("second@test.com");
        request2.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request2)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject invalid credentials")
    void loginInvalidCredentials() throws Exception {
        // Register user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testlogin");
        registerRequest.setEmail("testlogin@test.com");
        registerRequest.setPassword("correctpassword");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isOk());

        // Try login with wrong password
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setUsername("testlogin");
        loginRequest.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should reject access without token")
    void accessProtectedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isForbidden());
    }
}
