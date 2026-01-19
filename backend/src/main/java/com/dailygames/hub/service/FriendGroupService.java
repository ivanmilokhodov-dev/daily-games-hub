package com.dailygames.hub.service;

import com.dailygames.hub.dto.FriendGroupRequest;
import com.dailygames.hub.dto.FriendGroupResponse;
import com.dailygames.hub.model.FriendGroup;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.FriendGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendGroupService {

    private final FriendGroupRepository friendGroupRepository;

    @Transactional
    public FriendGroupResponse createGroup(User owner, FriendGroupRequest request) {
        FriendGroup group = new FriendGroup();
        group.setName(request.getName());
        group.setOwner(owner);
        group.setInviteCode(generateInviteCode());
        group.getMembers().add(owner);

        FriendGroup saved = friendGroupRepository.save(group);
        return mapToResponse(saved);
    }

    @Transactional
    public FriendGroupResponse joinGroup(User user, String inviteCode) {
        FriendGroup group = friendGroupRepository.findByInviteCode(inviteCode)
            .orElseThrow(() -> new IllegalArgumentException("Invalid invite code"));

        if (group.getMembers().contains(user)) {
            throw new IllegalArgumentException("You are already a member of this group");
        }

        group.getMembers().add(user);
        FriendGroup saved = friendGroupRepository.save(group);
        return mapToResponse(saved);
    }

    @Transactional
    public void leaveGroup(User user, Long groupId) {
        FriendGroup group = friendGroupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (group.getOwner().equals(user)) {
            throw new IllegalArgumentException("Owner cannot leave the group. Delete the group instead.");
        }

        group.getMembers().remove(user);
        friendGroupRepository.save(group);
    }

    @Transactional
    public void deleteGroup(User user, Long groupId) {
        FriendGroup group = friendGroupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getOwner().equals(user)) {
            throw new IllegalArgumentException("Only the owner can delete this group");
        }

        friendGroupRepository.delete(group);
    }

    public List<FriendGroupResponse> getUserGroups(User user) {
        return friendGroupRepository.findByMember(user).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public FriendGroup getGroupById(Long groupId) {
        return friendGroupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
    }

    public List<User> getGroupMembers(Long groupId) {
        FriendGroup group = getGroupById(groupId);
        return List.copyOf(group.getMembers());
    }

    private String generateInviteCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private FriendGroupResponse mapToResponse(FriendGroup group) {
        FriendGroupResponse response = new FriendGroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setInviteCode(group.getInviteCode());
        response.setOwnerUsername(group.getOwner().getUsername());
        response.setCreatedAt(group.getCreatedAt());
        response.setMembers(group.getMembers().stream()
            .map(member -> {
                FriendGroupResponse.MemberInfo info = new FriendGroupResponse.MemberInfo();
                info.setId(member.getId());
                info.setUsername(member.getUsername());
                info.setDisplayName(member.getDisplayName());
                return info;
            })
            .collect(Collectors.toList()));
        return response;
    }
}
