package com.dailygames.hub.controller;

import com.dailygames.hub.dto.FriendGroupRequest;
import com.dailygames.hub.dto.FriendGroupResponse;
import com.dailygames.hub.model.User;
import com.dailygames.hub.service.FriendGroupService;
import com.dailygames.hub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class FriendGroupController {

    private final FriendGroupService friendGroupService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<FriendGroupResponse> createGroup(
            @Valid @RequestBody FriendGroupRequest request,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(friendGroupService.createGroup(user, request));
    }

    @GetMapping
    public ResponseEntity<List<FriendGroupResponse>> getMyGroups(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(friendGroupService.getUserGroups(user));
    }

    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<FriendGroupResponse> joinGroup(
            @PathVariable String inviteCode,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(friendGroupService.joinGroup(user, inviteCode));
    }

    @DeleteMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        friendGroupService.leaveGroup(user, groupId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        friendGroupService.deleteGroup(user, groupId);
        return ResponseEntity.ok().build();
    }
}
