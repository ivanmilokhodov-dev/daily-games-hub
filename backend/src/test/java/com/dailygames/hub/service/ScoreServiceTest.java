package com.dailygames.hub.service;

import com.dailygames.hub.dto.ScoreRequest;
import com.dailygames.hub.dto.ScoreResponse;
import com.dailygames.hub.model.*;
import com.dailygames.hub.repository.FriendGroupRepository;
import com.dailygames.hub.repository.ScoreRepository;
import com.dailygames.hub.repository.StreakRepository;
import com.dailygames.hub.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoreServiceTest {

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private StreakRepository streakRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendGroupRepository friendGroupRepository;

    @Mock
    private RatingService ratingService;

    @InjectMocks
    private ScoreService scoreService;

    private User user;
    private ScoreRequest scoreRequest;
    private Score score;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setDisplayName("Test User");
        user.setGlobalDayStreak(0);
        user.setLongestGlobalStreak(0);

        scoreRequest = new ScoreRequest();
        scoreRequest.setGameType(GameType.WORDLE);
        scoreRequest.setRawResult("Wordle 123 4/6");
        scoreRequest.setAttempts(4);
        scoreRequest.setSolved(true);

        score = new Score();
        score.setId(1L);
        score.setUser(user);
        score.setGameType(GameType.WORDLE);
        score.setGameDate(LocalDate.now());
        score.setRawResult("Wordle 123 4/6");
        score.setAttempts(4);
        score.setSolved(true);
    }

    @Test
    @DisplayName("Should submit score successfully")
    void submitScore_Success() {
        when(scoreRepository.findByUserAndGameTypeAndGameDate(any(), any(), any()))
            .thenReturn(Optional.empty());
        when(scoreRepository.save(any(Score.class))).thenReturn(score);
        when(streakRepository.findByUserAndGameType(any(), any())).thenReturn(Optional.empty());
        when(streakRepository.save(any(Streak.class))).thenReturn(new Streak());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(friendGroupRepository.findByMember(any())).thenReturn(new ArrayList<>());

        ScoreResponse result = scoreService.submitScore(user, scoreRequest);

        assertThat(result).isNotNull();
        assertThat(result.getGameType()).isEqualTo(GameType.WORDLE);
        assertThat(result.getAttempts()).isEqualTo(4);
        verify(scoreRepository).save(any(Score.class));
    }

    @Test
    @DisplayName("Should throw exception when score already submitted for today")
    void submitScore_AlreadySubmitted() {
        when(scoreRepository.findByUserAndGameTypeAndGameDate(eq(user), eq(GameType.WORDLE), any()))
            .thenReturn(Optional.of(score));

        assertThatThrownBy(() -> scoreService.submitScore(user, scoreRequest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("You have already submitted a score for this game today");

        verify(scoreRepository, never()).save(any(Score.class));
    }

    @Test
    @DisplayName("Should get scores for date")
    void getScoresForDate_Success() {
        List<Score> scores = List.of(score);
        when(scoreRepository.findByGameDateOrderBySubmittedAtDesc(any(LocalDate.class)))
            .thenReturn(scores);

        List<ScoreResponse> result = scoreService.getScoresForDate(LocalDate.now());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getGameType()).isEqualTo(GameType.WORDLE);
    }

    @Test
    @DisplayName("Should get user scores")
    void getUserScores_Success() {
        List<Score> scores = List.of(score);
        when(scoreRepository.findRecentByUser(user.getId())).thenReturn(scores);

        List<ScoreResponse> result = scoreService.getUserScores(user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("Should update streak when submitting score")
    void submitScore_UpdatesStreak() {
        Streak streak = new Streak();
        streak.setUser(user);
        streak.setGameType(GameType.WORDLE);
        streak.setCurrentStreak(5);
        streak.setLongestStreak(5);
        streak.setLastPlayedDate(LocalDate.now().minusDays(1));

        when(scoreRepository.findByUserAndGameTypeAndGameDate(any(), any(), any()))
            .thenReturn(Optional.empty());
        when(scoreRepository.save(any(Score.class))).thenReturn(score);
        when(streakRepository.findByUserAndGameType(user, GameType.WORDLE))
            .thenReturn(Optional.of(streak));
        when(streakRepository.save(any(Streak.class))).thenReturn(streak);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(friendGroupRepository.findByMember(any())).thenReturn(new ArrayList<>());

        scoreService.submitScore(user, scoreRequest);

        verify(streakRepository).save(any(Streak.class));
    }
}
