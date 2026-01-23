package com.dailygames.hub.config;

import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;

    @Override
    public void run(ApplicationArguments args) {
        // Ensure user with ID 1 is always the primary admin
        userRepository.findById(1L).ifPresent(user -> {
            if (!Boolean.TRUE.equals(user.getIsAdmin())) {
                user.setIsAdmin(true);
                userRepository.save(user);
                log.info("Set user {} (ID=1) as primary admin", user.getUsername());
            }
        });
    }
}
