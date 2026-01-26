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
        } else if (gameType == GameType.CONNECTIONS) {
            // Connections: attempts = total guesses (4-8), mistakes = attempts - 4
            // 0 mistakes (4 guesses) = +32, 1 = +24, 2 = +16, 3 = +8, 4+ = -32
            if (solved) {
                rating.setGamesWon(rating.getGamesWon() + 1);
                int mistakes = attempts - 4; // 4 correct guesses needed, rest are mistakes
                // Each mistake costs 8 points: (4 - mistakes) / 4 gives 1.0, 0.75, 0.5, 0.25
                double performance = (4.0 - mistakes) / 4.0;
                ratingChange = (int) (K_FACTOR * performance);
            } else {
                ratingChange = -K_FACTOR;
            }
        } else if (gameType == GameType.TRAVLE) {
            // Travle: attempts = penalty (extra tries beyond perfect, the +X value)
            // +0 (perfect) = +32, +1 = +28, +2 = +24, etc. (-4 per extra try)
            if (solved) {
                rating.setGamesWon(rating.getGamesWon() + 1);
                ratingChange = K_FACTOR - (attempts * 4);
            } else {
                ratingChange = -K_FACTOR;
            }
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
        // Calculate average including all games (unplayed games count as BASE_RATING)
        List<Rating> existingRatings = ratingRepository.findByUser(user);
        int totalGames = GameType.values().length;

        int totalRating = 0;
        for (GameType gameType : GameType.values()) {
            Rating existingRating = existingRatings.stream()
                .filter(r -> r.getGameType() == gameType)
                .findFirst()
                .orElse(null);

            if (existingRating != null) {
                totalRating += existingRating.getRating();
            } else {
                totalRating += BASE_RATING; // Unplayed games count as 1000
            }
        }

        user.setAverageRating(totalRating / totalGames);
        userRepository.save(user);
    }

    public List<RatingResponse> getUserRatings(User user) {
        // Return ratings for ALL games, including unplayed ones with default rating
        List<Rating> existingRatings = ratingRepository.findByUser(user);

        return java.util.Arrays.stream(GameType.values())
            .map(gameType -> {
                Rating existingRating = existingRatings.stream()
                    .filter(r -> r.getGameType() == gameType)
                    .findFirst()
                    .orElse(null);

                if (existingRating != null) {
                    return mapToResponse(existingRating);
                } else {
                    // Create a response for unplayed game with default rating
                    RatingResponse response = new RatingResponse();
                    response.setGameType(gameType.name());
                    response.setGameDisplayName(gameType.getDisplayName());
                    response.setRating(BASE_RATING);
                    response.setGamesPlayed(0);
                    response.setGamesWon(0);
                    return response;
                }
            })
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
