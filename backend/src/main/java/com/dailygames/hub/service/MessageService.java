package com.dailygames.hub.service;

import com.dailygames.hub.dto.ConversationResponse;
import com.dailygames.hub.dto.MessageRequest;
import com.dailygames.hub.dto.MessageResponse;
import com.dailygames.hub.model.Message;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.MessageRepository;
import com.dailygames.hub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FriendshipService friendshipService;

    @Transactional
    public MessageResponse sendMessage(User sender, MessageRequest request) {
        User receiver = userRepository.findById(request.getReceiverId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (sender.getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("Cannot send message to yourself");
        }

        // Check if they are friends
        if (!friendshipService.areFriends(sender, receiver)) {
            throw new IllegalArgumentException("You can only message friends");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(request.getContent());

        Message saved = messageRepository.save(message);
        return mapToResponse(saved, sender);
    }

    public List<MessageResponse> getConversation(User currentUser, Long partnerId) {
        User partner = userRepository.findById(partnerId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Message> messages = messageRepository.findConversation(currentUser, partner);

        // Mark messages as read
        markAsRead(currentUser, messages);

        return messages.stream()
            .map(m -> mapToResponse(m, currentUser))
            .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(User currentUser, List<Message> messages) {
        for (Message message : messages) {
            if (message.getReceiver().getId().equals(currentUser.getId()) && !message.getIsRead()) {
                message.setIsRead(true);
                messageRepository.save(message);
            }
        }
    }

    public List<ConversationResponse> getConversations(User currentUser) {
        List<User> partners = messageRepository.findConversationPartners(currentUser);
        List<ConversationResponse> conversations = new ArrayList<>();

        for (User partner : partners) {
            List<Message> messages = messageRepository.findConversation(currentUser, partner);
            if (!messages.isEmpty()) {
                Message lastMessage = messages.get(messages.size() - 1);

                ConversationResponse response = new ConversationResponse();
                response.setPartnerId(partner.getId());
                response.setPartnerUsername(partner.getUsername());
                response.setPartnerDisplayName(partner.getDisplayName());
                response.setPartnerGlobalDayStreak(partner.getGlobalDayStreak());
                response.setLastMessage(lastMessage.getContent().length() > 50
                    ? lastMessage.getContent().substring(0, 50) + "..."
                    : lastMessage.getContent());
                response.setLastMessageAt(lastMessage.getSentAt());

                long unreadCount = messages.stream()
                    .filter(m -> m.getReceiver().getId().equals(currentUser.getId()) && !m.getIsRead())
                    .count();
                response.setUnreadCount(unreadCount);

                conversations.add(response);
            }
        }

        // Sort by last message time, descending
        conversations.sort(Comparator.comparing(ConversationResponse::getLastMessageAt).reversed());

        return conversations;
    }

    public Long getUnreadCount(User user) {
        return messageRepository.countUnreadForUser(user);
    }

    private MessageResponse mapToResponse(Message message, User currentUser) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setSenderId(message.getSender().getId());
        response.setSenderUsername(message.getSender().getUsername());
        response.setSenderDisplayName(message.getSender().getDisplayName());
        response.setReceiverId(message.getReceiver().getId());
        response.setReceiverUsername(message.getReceiver().getUsername());
        response.setReceiverDisplayName(message.getReceiver().getDisplayName());
        response.setContent(message.getContent());
        response.setSentAt(message.getSentAt());
        response.setIsRead(message.getIsRead());
        response.setIsOwn(message.getSender().getId().equals(currentUser.getId()));
        return response;
    }
}
