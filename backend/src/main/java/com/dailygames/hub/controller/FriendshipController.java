package com.dailygames.hub.controller;

import com.dailygames.hub.dto.FriendResponse;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.UserRepository;
import com.dailygames.hub.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<FriendResponse>> getFriends(Authentication auth) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(friendshipService.getFriends(currentUser));
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<FriendResponse>> getPendingRequests(Authentication auth) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(friendshipService.getPendingRequests(currentUser));
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<List<FriendResponse>> getSentRequests(Authentication auth) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(friendshipService.getSentRequests(currentUser));
    }

    @PostMapping("/request/{userId}")
    public ResponseEntity<FriendResponse> sendFriendRequest(
            Authentication auth,
            @PathVariable Long userId) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(friendshipService.sendFriendRequest(currentUser, userId));
    }

    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<FriendResponse> acceptFriendRequest(
            Authentication auth,
            @PathVariable Long friendshipId) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(friendshipService.acceptFriendRequest(currentUser, friendshipId));
    }

    @PostMapping("/decline/{friendshipId}")
    public ResponseEntity<Map<String, String>> declineFriendRequest(
            Authentication auth,
            @PathVariable Long friendshipId) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        friendshipService.declineFriendRequest(currentUser, friendshipId);
        return ResponseEntity.ok(Map.of("message", "Request declined"));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Map<String, String>> removeFriend(
            Authentication auth,
            @PathVariable Long friendId) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        friendshipService.removeFriend(currentUser, friendId);
        return ResponseEntity.ok(Map.of("message", "Friend removed"));
    }
}
