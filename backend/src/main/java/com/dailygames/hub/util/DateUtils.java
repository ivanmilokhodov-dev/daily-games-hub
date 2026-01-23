package com.dailygames.hub.util;

import java.time.LocalDate;
import java.time.ZoneId;

public class DateUtils {

    // Amsterdam timezone - used as the reference for daily game resets
    public static final ZoneId AMSTERDAM_ZONE = ZoneId.of("Europe/Amsterdam");

    /**
     * Gets the current date in Amsterdam timezone.
     * This is used to determine the "game day" - a new day starts at 00:00 Amsterdam time.
     */
    public static LocalDate todayAmsterdam() {
        return LocalDate.now(AMSTERDAM_ZONE);
    }
}
