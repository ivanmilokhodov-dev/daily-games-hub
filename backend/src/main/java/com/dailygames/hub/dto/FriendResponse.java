package com.dailygames.hub.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FriendResponse {
    private Long id;
    private Long friendId;
    private String username;
    private String displayName;
    private Integer globalDayStreak;
    private Integer averageRating;
    private String status;
    private LocalDateTime since;
    private Boolean isSender;
}
