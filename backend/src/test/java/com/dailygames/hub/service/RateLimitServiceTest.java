package com.dailygames.hub.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitServiceTest {

    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new RateLimitService();
    }

    @Test
    @DisplayName("Should allow first request")
    void isAllowed_FirstRequest() {
        boolean result = rateLimitService.isAllowed("test@example.com");

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should allow up to 3 requests within window")
    void isAllowed_MultipleRequestsWithinLimit() {
        assertThat(rateLimitService.isAllowed("test@example.com")).isTrue();
        assertThat(rateLimitService.isAllowed("test@example.com")).isTrue();
        assertThat(rateLimitService.isAllowed("test@example.com")).isTrue();
    }

    @Test
    @DisplayName("Should block 4th request within window")
    void isAllowed_ExceedsLimit() {
        rateLimitService.isAllowed("test@example.com");
        rateLimitService.isAllowed("test@example.com");
        rateLimitService.isAllowed("test@example.com");

        boolean result = rateLimitService.isAllowed("test@example.com");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should track different emails separately")
    void isAllowed_SeparateTracking() {
        // Max out first email
        rateLimitService.isAllowed("email1@example.com");
        rateLimitService.isAllowed("email1@example.com");
        rateLimitService.isAllowed("email1@example.com");
        rateLimitService.isAllowed("email1@example.com"); // This should be blocked

        // Second email should still be allowed
        boolean result = rateLimitService.isAllowed("email2@example.com");

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should normalize email case")
    void isAllowed_CaseInsensitive() {
        rateLimitService.isAllowed("Test@Example.COM");
        rateLimitService.isAllowed("test@example.com");
        rateLimitService.isAllowed("TEST@EXAMPLE.COM");

        boolean result = rateLimitService.isAllowed("test@example.com");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should return positive time until reset when rate limited")
    void getSecondsUntilReset_WhenRateLimited() {
        rateLimitService.isAllowed("test@example.com");

        long secondsUntilReset = rateLimitService.getSecondsUntilReset("test@example.com");

        assertThat(secondsUntilReset).isGreaterThan(0);
        assertThat(secondsUntilReset).isLessThanOrEqualTo(3600);
    }

    @Test
    @DisplayName("Should return 0 for unknown key")
    void getSecondsUntilReset_UnknownKey() {
        long secondsUntilReset = rateLimitService.getSecondsUntilReset("unknown@example.com");

        assertThat(secondsUntilReset).isEqualTo(0);
    }
}
