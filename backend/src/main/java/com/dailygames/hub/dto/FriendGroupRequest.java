package com.dailygames.hub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FriendGroupRequest {
    @NotBlank(message = "Group name is required")
    @Size(max = 50, message = "Group name must be at most 50 characters")
    private String name;
}
