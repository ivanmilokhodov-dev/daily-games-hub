package com.dailygames.hub.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageResponse {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private String senderDisplayName;
    private Long receiverId;
    private String receiverUsername;
    private String receiverDisplayName;
    private String content;
    private LocalDateTime sentAt;
    private Boolean isRead;
    private Boolean isOwn;
}
