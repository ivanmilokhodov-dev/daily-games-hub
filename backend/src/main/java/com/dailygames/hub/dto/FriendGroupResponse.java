package com.dailygames.hub.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class FriendGroupResponse {
    private Long id;
    private String name;
    private String inviteCode;
    private String ownerUsername;
    private List<MemberInfo> members;
    private LocalDateTime createdAt;

    @Data
    public static class MemberInfo {
        private Long id;
        private String username;
        private String displayName;
    }
}
