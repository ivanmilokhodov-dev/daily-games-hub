package com.dailygames.hub.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Simple in-memory rate limiting service for password reset requests.
 * Limits requests by email address to prevent abuse.
 */
@Service
public class RateLimitService {

    private static final int MAX_REQUESTS = 3;
    private static final long WINDOW_SECONDS = 3600; // 1 hour window

    private final ConcurrentMap<String, RateLimitEntry> requestCounts = new ConcurrentHashMap<>();

    /**
     * Check if a request is allowed for the given key (e.g., email address).
     * Returns true if the request is within rate limits, false if rate limited.
     */
    public boolean isAllowed(String key) {
        String normalizedKey = key.toLowerCase().trim();
        Instant now = Instant.now();

        requestCounts.compute(normalizedKey, (k, entry) -> {
            if (entry == null || entry.isExpired(now)) {
                return new RateLimitEntry(1, now);
            }
            entry.incrementCount();
            return entry;
        });

        RateLimitEntry entry = requestCounts.get(normalizedKey);
        return entry != null && entry.getCount() <= MAX_REQUESTS;
    }

    /**
     * Get the remaining time in seconds until the rate limit resets for the given key.
     */
    public long getSecondsUntilReset(String key) {
        String normalizedKey = key.toLowerCase().trim();
        RateLimitEntry entry = requestCounts.get(normalizedKey);
        if (entry == null) {
            return 0;
        }
        long elapsed = Instant.now().getEpochSecond() - entry.getWindowStart().getEpochSecond();
        return Math.max(0, WINDOW_SECONDS - elapsed);
    }

    private static class RateLimitEntry {
        private int count;
        private final Instant windowStart;

        RateLimitEntry(int count, Instant windowStart) {
            this.count = count;
            this.windowStart = windowStart;
        }

        void incrementCount() {
            this.count++;
        }

        int getCount() {
            return count;
        }

        Instant getWindowStart() {
            return windowStart;
        }

        boolean isExpired(Instant now) {
            return now.getEpochSecond() - windowStart.getEpochSecond() > WINDOW_SECONDS;
        }
    }
}
