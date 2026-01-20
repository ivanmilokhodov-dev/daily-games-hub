package com.dailygames.hub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MessageRequest {
    @NotNull
    private Long receiverId;

    @NotBlank
    @Size(max = 1000)
    private String content;
}
