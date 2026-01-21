package com.dailygames.hub.service;

import com.dailygames.hub.dto.RatingResponse;
import com.dailygames.hub.model.GameType;
import com.dailygames.hub.model.Rating;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.RatingRepository;
import com.dailygames.hub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    private static final int K_FACTOR = 32;
    private static final int BASE_RATING = 1000;

    @Transactional
    public int updateRating(User user, GameType gameType, boolean solved, int attempts, Integer score) {
        Rating rating = ratingRepository.findByUserAndGameType(user, gameType)
            .orElseGet(() -> {
                Rating newRating = new Rating();
                newRating.setUser(user);
                newRating.setGameType(gameType);
                newRating.setRating(BASE_RATING);
                newRating.setGamesPlayed(0);
                newRating.setGamesWon(0);
                return newRating;
            });

        rating.setGamesPlayed(rating.getGamesPlayed() + 1);

        // Symmetric MMR: perfect score gives +K_FACTOR, worst score gives -K_FACTOR
        int maxAttempts = getMaxAttemptsForGame(gameType);
        int ratingChange;

        // Special handling for Horse game - always solved, score-based (higher is better)
        if (gameType == GameType.HORSE && score != null) {
            rating.setGamesWon(rating.getGamesWon() + 1);
            // Score is 0-100, convert to performance (-1 to +1 range, where 100 = +1, 0 = -1)
            double performance = (score - 50.0) / 50.0;
            ratingChange = (int) (K_FACTOR * performance);
        } else if (solved) {
            rating.setGamesWon(rating.getGamesWon() + 1);
            // Symmetric: perfect (1 attempt) = +K_FACTOR, worst solved (max attempts) = 0
            // performance ranges from 1.0 (perfect) to 0.0 (worst solved)
            double performance = 1.0 - ((double) (attempts - 1) / (maxAttempts - 1));
            ratingChange = (int) (K_FACTOR * performance);
        } else {
            // Failed: always -K_FACTOR (symmetric with perfect score which gives +K_FACTOR)
            ratingChange = -K_FACTOR;
        }

        rating.setRating(Math.max(0, rating.getRating() + ratingChange));
        ratingRepository.save(rating);

        // Update user's average rating
        updateAverageRating(user);

        return ratingChange;
    }

    private int getMaxAttemptsForGame(GameType gameType) {
        // Define max attempts for each game type
        return switch (gameType) {
            case WORDLE -> 6;
            case CONNECTIONS -> 4;
            case SPOTLE -> 10;
            case BANDLE -> 6;
            case TRAVLE -> 10;
            case COUNTRYLE -> 6;
            case MINUTE_CRYPTIC -> 12; // Max hints before it's considered poor
            case CONTEXTO -> 100;
            case SEMANTLE -> 100;
            case HORSE -> 100; // Score-based, not attempt-based
        };
    }

    @Transactional
    public void updateAverageRating(User user) {
        Double avg = ratingRepository.getAverageRatingForUser(user);
        if (avg != null) {
            user.setAverageRating(avg.intValue());
            userRepository.save(user);
        }
    }

    public List<RatingResponse> getUserRatings(User user) {
        return ratingRepository.findByUser(user).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private RatingResponse mapToResponse(Rating rating) {
        RatingResponse response = new RatingResponse();
        response.setGameType(rating.getGameType().name());
        response.setGameDisplayName(rating.getGameType().getDisplayName());
        response.setRating(rating.getRating());
        response.setGamesPlayed(rating.getGamesPlayed());
        response.setGamesWon(rating.getGamesWon());
        return response;
    }
}
