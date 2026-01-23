package com.dailygames.hub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String email;
    private String displayName;
    private Integer globalDayStreak;
    private Integer averageRating;
    private Boolean isAdmin;
}
