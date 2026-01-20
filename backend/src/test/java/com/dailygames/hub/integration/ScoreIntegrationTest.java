package com.dailygames.hub.integration;

import com.dailygames.hub.dto.RegisterRequest;
import com.dailygames.hub.dto.ScoreRequest;
import com.dailygames.hub.model.GameType;
import com.dailygames.hub.repository.ScoreRepository;
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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ScoreIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    private String authToken;

    @BeforeEach
    void setUp() throws Exception {
        scoreRepository.deleteAll();
        userRepository.deleteAll();

        // Register and login to get token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("scoreuser");
        registerRequest.setEmail("score@test.com");
        registerRequest.setPassword("password123");
        registerRequest.setDisplayName("Score User");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isOk())
            .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        authToken = objectMapper.readTree(responseBody).get("token").asText();
    }

    @Test
    @DisplayName("Should submit score successfully")
    void submitScore_Success() throws Exception {
        ScoreRequest scoreRequest = new ScoreRequest();
        scoreRequest.setGameType(GameType.WORDLE);
        scoreRequest.setRawResult("Wordle 123 4/6\n⬛🟨⬛⬛⬛\n⬛⬛🟩🟩⬛\n🟩🟩🟩🟩⬛\n🟩🟩🟩🟩🟩");
        scoreRequest.setAttempts(4);
        scoreRequest.setSolved(true);
        scoreRequest.setGameDate(LocalDate.now());

        mockMvc.perform(post("/api/scores")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.gameType").value("WORDLE"))
            .andExpect(jsonPath("$.attempts").value(4))
            .andExpect(jsonPath("$.solved").value(true));

        // Verify score was saved
        assertThat(scoreRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should reject duplicate score for same game same day")
    void submitScore_Duplicate() throws Exception {
        ScoreRequest scoreRequest = new ScoreRequest();
        scoreRequest.setGameType(GameType.CONNECTIONS);
        scoreRequest.setRawResult("Connections #123\n🟨🟨🟨🟨\n🟩🟩🟩🟩\n🟦🟦🟦🟦\n🟪🟪🟪🟪");
        scoreRequest.setAttempts(4);
        scoreRequest.setSolved(true);
        scoreRequest.setGameDate(LocalDate.now());

        // First submission should succeed
        mockMvc.perform(post("/api/scores")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreRequest)))
            .andExpect(status().isOk());

        // Second submission should fail
        mockMvc.perform(post("/api/scores")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreRequest)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should get user scores")
    void getUserScores() throws Exception {
        // Submit a score first
        ScoreRequest scoreRequest = new ScoreRequest();
        scoreRequest.setGameType(GameType.CONTEXTO);
        scoreRequest.setRawResult("I played contexto #100 and got it in 50 guesses");
        scoreRequest.setAttempts(50);
        scoreRequest.setSolved(true);
        scoreRequest.setGameDate(LocalDate.now());

        mockMvc.perform(post("/api/scores")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreRequest)))
            .andExpect(status().isOk());

        // Get user scores
        mockMvc.perform(get("/api/scores/my")
                .header("Authorization", "Bearer " + authToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].gameType").value("CONTEXTO"))
            .andExpect(jsonPath("$[0].attempts").value(50));
    }

    @Test
    @DisplayName("Should update streak when submitting score")
    void submitScore_UpdatesStreak() throws Exception {
        ScoreRequest scoreRequest = new ScoreRequest();
        scoreRequest.setGameType(GameType.SEMANTLE);
        scoreRequest.setRawResult("Semantle #100 - 30 guesses");
        scoreRequest.setAttempts(30);
        scoreRequest.setSolved(true);
        scoreRequest.setGameDate(LocalDate.now());

        mockMvc.perform(post("/api/scores")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreRequest)))
            .andExpect(status().isOk());

        // Check streaks
        mockMvc.perform(get("/api/streaks/my")
                .header("Authorization", "Bearer " + authToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].gameType").value("SEMANTLE"))
            .andExpect(jsonPath("$[0].currentStreak").value(1));
    }

    @Test
    @DisplayName("Should reject score submission without auth")
    void submitScore_Unauthorized() throws Exception {
        ScoreRequest scoreRequest = new ScoreRequest();
        scoreRequest.setGameType(GameType.WORDLE);
        scoreRequest.setRawResult("Wordle 123 4/6");

        mockMvc.perform(post("/api/scores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreRequest)))
            .andExpect(status().isForbidden());
    }
}
