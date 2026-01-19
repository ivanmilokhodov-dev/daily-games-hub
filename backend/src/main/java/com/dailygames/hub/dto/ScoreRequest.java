package com.dailygames.hub.dto;

import com.dailygames.hub.model.GameType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ScoreRequest {
    @NotNull(message = "Game type is required")
    private GameType gameType;

    @NotBlank(message = "Result text is required")
    private String rawResult;

    private LocalDate gameDate;

    private Integer attempts;
    private Boolean solved;
    private Integer score;
    private Integer timeSeconds;
}
