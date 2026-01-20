package com.dailygames.hub.repository;

import com.dailygames.hub.model.GameType;
import com.dailygames.hub.model.Rating;
import com.dailygames.hub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByUserAndGameType(User user, GameType gameType);

    List<Rating> findByUser(User user);

    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.user = :user")
    Double getAverageRatingForUser(@Param("user") User user);

    @Query("SELECT r FROM Rating r WHERE r.gameType = :gameType ORDER BY r.rating DESC")
    List<Rating> findTopByGameType(@Param("gameType") GameType gameType);
}
