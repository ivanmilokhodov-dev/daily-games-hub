package com.dailygames.hub.controller;

import com.dailygames.hub.dto.ConversationResponse;
import com.dailygames.hub.dto.MessageRequest;
import com.dailygames.hub.dto.MessageResponse;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.UserRepository;
import com.dailygames.hub.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserRepository userRepository;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(Authentication auth) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(messageService.getConversations(currentUser));
    }

    @GetMapping("/conversation/{partnerId}")
    public ResponseEntity<List<MessageResponse>> getConversation(
            Authentication auth,
            @PathVariable Long partnerId) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(messageService.getConversation(currentUser, partnerId));
    }

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            Authentication auth,
            @Valid @RequestBody MessageRequest request) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(messageService.sendMessage(currentUser, request));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(Map.of("count", messageService.getUnreadCount(currentUser)));
    }
}
