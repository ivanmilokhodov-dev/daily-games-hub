package com.dailygames.hub.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationResponse {
    private Long partnerId;
    private String partnerUsername;
    private String partnerDisplayName;
    private Integer partnerGlobalDayStreak;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private Long unreadCount;
}
