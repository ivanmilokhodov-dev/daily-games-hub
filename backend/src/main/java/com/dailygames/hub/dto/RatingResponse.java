package com.dailygames.hub.dto;

import lombok.Data;

@Data
public class RatingResponse {
    private String gameType;
    private String gameDisplayName;
    private Integer rating;
    private Integer gamesPlayed;
    private Integer gamesWon;
}
