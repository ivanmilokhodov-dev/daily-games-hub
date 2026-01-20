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
    public void updateRating(User user, GameType gameType, boolean solved, int attempts) {
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

        if (solved) {
            rating.setGamesWon(rating.getGamesWon() + 1);
            // ELO-like calculation: more points for fewer attempts
            int maxAttempts = getMaxAttemptsForGame(gameType);
            double performance = 1.0 - ((double) (attempts - 1) / maxAttempts);
            int ratingChange = (int) (K_FACTOR * performance);
            rating.setRating(Math.max(0, rating.getRating() + ratingChange));
        } else {
            // Lost: decrease rating
            rating.setRating(Math.max(0, rating.getRating() - K_FACTOR / 2));
        }

        ratingRepository.save(rating);

        // Update user's average rating
        updateAverageRating(user);
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
            case WORLDLE -> 6;
            case MINUTE_CRYPTIC -> 1;
            case CONTEXTO -> 100;
            case SEMANTLE -> 100;
            case HORSE -> 10;
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
