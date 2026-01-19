package com.dailygames.hub.service;

import com.dailygames.hub.model.Streak;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.StreakRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final StreakRepository streakRepository;

    public List<Streak> getUserStreaks(User user) {
        return streakRepository.findByUser(user);
    }
}
