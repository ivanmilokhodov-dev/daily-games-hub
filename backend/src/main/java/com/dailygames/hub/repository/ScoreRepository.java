package com.dailygames.hub.repository;

import com.dailygames.hub.model.GameType;
import com.dailygames.hub.model.Score;
import com.dailygames.hub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {

    List<Score> findByUserAndGameDate(User user, LocalDate gameDate);

    List<Score> findByUserAndGameType(User user, GameType gameType);

    Optional<Score> findByUserAndGameTypeAndGameDate(User user, GameType gameType, LocalDate gameDate);

    List<Score> findByGameDateOrderBySubmittedAtDesc(LocalDate gameDate);

    @Query("SELECT s FROM Score s WHERE s.user IN :users AND s.gameDate = :date ORDER BY s.gameType, s.submittedAt")
    List<Score> findByUsersAndDate(@Param("users") List<User> users, @Param("date") LocalDate date);

    @Query("SELECT s FROM Score s WHERE s.user.id = :userId ORDER BY s.gameDate DESC, s.gameType")
    List<Score> findRecentByUser(@Param("userId") Long userId);
}
