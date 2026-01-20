package com.dailygames.hub.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String displayName;
    private String email;
}
