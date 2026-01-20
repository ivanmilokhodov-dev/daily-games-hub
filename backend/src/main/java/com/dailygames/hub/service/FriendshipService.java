package com.dailygames.hub.service;

import com.dailygames.hub.dto.FriendResponse;
import com.dailygames.hub.model.Friendship;
import com.dailygames.hub.model.Friendship.FriendshipStatus;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.FriendshipRepository;
import com.dailygames.hub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    @Transactional
    public FriendResponse sendFriendRequest(User sender, Long receiverId) {
        User receiver = userRepository.findById(receiverId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (sender.getId().equals(receiverId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        Optional<Friendship> existing = friendshipRepository.findFriendshipBetween(sender, receiver);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new IllegalArgumentException("Already friends");
            } else if (f.getStatus() == FriendshipStatus.PENDING) {
                throw new IllegalArgumentException("Friend request already pending");
            }
        }

        Friendship friendship = new Friendship();
        friendship.setUser(sender);
        friendship.setFriend(receiver);
        friendship.setStatus(FriendshipStatus.PENDING);

        Friendship saved = friendshipRepository.save(friendship);
        return mapToResponse(saved, sender);
    }

    @Transactional
    public FriendResponse acceptFriendRequest(User user, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        if (!friendship.getFriend().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to accept this request");
        }

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new IllegalArgumentException("Request is not pending");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendship.setAcceptedAt(LocalDateTime.now());

        Friendship saved = friendshipRepository.save(friendship);
        return mapToResponse(saved, user);
    }

    @Transactional
    public void declineFriendRequest(User user, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        if (!friendship.getFriend().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to decline this request");
        }

        friendship.setStatus(FriendshipStatus.DECLINED);
        friendshipRepository.save(friendship);
    }

    @Transactional
    public void removeFriend(User user, Long friendId) {
        User friend = userRepository.findById(friendId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Optional<Friendship> friendship = friendshipRepository.findFriendshipBetween(user, friend);
        friendship.ifPresent(friendshipRepository::delete);
    }

    public List<FriendResponse> getFriends(User user) {
        return friendshipRepository.findByUserOrFriendAndStatus(user, FriendshipStatus.ACCEPTED).stream()
            .map(f -> mapToResponse(f, user))
            .collect(Collectors.toList());
    }

    public List<FriendResponse> getPendingRequests(User user) {
        return friendshipRepository.findPendingRequestsForUser(user).stream()
            .map(f -> mapToResponse(f, user))
            .collect(Collectors.toList());
    }

    public List<FriendResponse> getSentRequests(User user) {
        return friendshipRepository.findSentRequestsByUser(user).stream()
            .map(f -> mapToResponse(f, user))
            .collect(Collectors.toList());
    }

    public boolean areFriends(User user1, User user2) {
        return friendshipRepository.areFriends(user1, user2);
    }

    public String getFriendshipStatus(User currentUser, User otherUser) {
        if (currentUser.getId().equals(otherUser.getId())) {
            return null;
        }

        Optional<Friendship> friendship = friendshipRepository.findFriendshipBetween(currentUser, otherUser);
        if (friendship.isEmpty()) {
            return null;
        }

        Friendship f = friendship.get();
        if (f.getStatus() == FriendshipStatus.ACCEPTED) {
            return "ACCEPTED";
        } else if (f.getStatus() == FriendshipStatus.PENDING) {
            if (f.getUser().getId().equals(currentUser.getId())) {
                return "SENT";
            } else {
                return "PENDING";
            }
        }
        return null;
    }

    private FriendResponse mapToResponse(Friendship friendship, User currentUser) {
        FriendResponse response = new FriendResponse();
        response.setId(friendship.getId());

        User friend = friendship.getUser().getId().equals(currentUser.getId())
            ? friendship.getFriend()
            : friendship.getUser();

        response.setFriendId(friend.getId());
        response.setUsername(friend.getUsername());
        response.setDisplayName(friend.getDisplayName());
        response.setGlobalDayStreak(friend.getGlobalDayStreak());
        response.setAverageRating(friend.getAverageRating());
        response.setStatus(friendship.getStatus().name());
        response.setSince(friendship.getAcceptedAt() != null ? friendship.getAcceptedAt() : friendship.getCreatedAt());
        response.setIsSender(friendship.getUser().getId().equals(currentUser.getId()));

        return response;
    }
}
