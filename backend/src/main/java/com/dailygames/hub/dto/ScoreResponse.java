package com.dailygames.hub.dto;

import com.dailygames.hub.model.GameType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ScoreResponse {
    private Long id;
    private String username;
    private String displayName;
    private GameType gameType;
    private String gameDisplayName;
    private LocalDate gameDate;
    private String rawResult;
    private Integer attempts;
    private Boolean solved;
    private Integer score;
    private Integer timeSeconds;
    private LocalDateTime submittedAt;
}
