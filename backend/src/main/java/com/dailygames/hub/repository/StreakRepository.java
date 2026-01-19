package com.dailygames.hub.repository;

import com.dailygames.hub.model.GameType;
import com.dailygames.hub.model.Streak;
import com.dailygames.hub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StreakRepository extends JpaRepository<Streak, Long> {

    List<Streak> findByUser(User user);

    Optional<Streak> findByUserAndGameType(User user, GameType gameType);
}
