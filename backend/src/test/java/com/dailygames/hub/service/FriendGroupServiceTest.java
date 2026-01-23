package com.dailygames.hub.service;

import com.dailygames.hub.dto.FriendGroupRequest;
import com.dailygames.hub.dto.FriendGroupResponse;
import com.dailygames.hub.dto.RatingResponse;
import com.dailygames.hub.model.FriendGroup;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.FriendGroupRepository;
import com.dailygames.hub.repository.ScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FriendGroupServiceTest {

    @Mock
    private FriendGroupRepository friendGroupRepository;

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private RatingService ratingService;

    @InjectMocks
    private FriendGroupService friendGroupService;

    private User owner;
    private User member;
    private FriendGroup group;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setUsername("owner");
        owner.setDisplayName("Owner");

        member = new User();
        member.setId(2L);
        member.setUsername("member");
        member.setDisplayName("Member");

        group = new FriendGroup();
        group.setId(1L);
        group.setName("Test Group");
        group.setInviteCode("ABC12345");
        group.setOwner(owner);
        group.setMembers(new HashSet<>(Set.of(owner)));
        group.setGroupStreak(0);
        group.setLongestGroupStreak(0);

        // Mock rating service to return default ratings
        RatingResponse defaultRating = new RatingResponse();
        defaultRating.setRating(1000);
        when(ratingService.getUserRatings(any(User.class))).thenReturn(List.of(defaultRating));
    }

    @Test
    @DisplayName("Should create group successfully")
    void createGroup_Success() {
        when(friendGroupRepository.save(any(FriendGroup.class))).thenReturn(group);

        FriendGroupRequest request = new FriendGroupRequest();
        request.setName("Test Group");
        FriendGroupResponse result = friendGroupService.createGroup(owner, request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test Group");
        assertThat(result.getOwnerId()).isEqualTo(1L);
        verify(friendGroupRepository).save(any(FriendGroup.class));
    }

    @Test
    @DisplayName("Should join group successfully")
    void joinGroup_Success() {
        when(friendGroupRepository.findByInviteCode("ABC12345")).thenReturn(Optional.of(group));
        when(friendGroupRepository.save(any(FriendGroup.class))).thenReturn(group);

        FriendGroupResponse result = friendGroupService.joinGroup(member, "ABC12345");

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test Group");
        verify(friendGroupRepository).save(group);
    }

    @Test
    @DisplayName("Should throw exception when invite code is invalid")
    void joinGroup_InvalidCode() {
        when(friendGroupRepository.findByInviteCode("INVALID")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> friendGroupService.joinGroup(member, "INVALID"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid invite code");
    }

    @Test
    @DisplayName("Should throw exception when already a member")
    void joinGroup_AlreadyMember() {
        when(friendGroupRepository.findByInviteCode("ABC12345")).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> friendGroupService.joinGroup(owner, "ABC12345"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("You are already a member of this group");
    }

    @Test
    @DisplayName("Should leave group successfully")
    void leaveGroup_Success() {
        group.getMembers().add(member);
        when(friendGroupRepository.findByIdWithMembers(1L)).thenReturn(Optional.of(group));
        when(friendGroupRepository.save(any(FriendGroup.class))).thenReturn(group);

        friendGroupService.leaveGroup(member, 1L);

        verify(friendGroupRepository).save(group);
        assertThat(group.getMembers()).doesNotContain(member);
    }

    @Test
    @DisplayName("Should throw exception when owner tries to leave")
    void leaveGroup_OwnerCannotLeave() {
        when(friendGroupRepository.findByIdWithMembers(1L)).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> friendGroupService.leaveGroup(owner, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Owner cannot leave the group. Delete the group instead.");
    }

    @Test
    @DisplayName("Should delete group successfully")
    void deleteGroup_Success() {
        when(friendGroupRepository.findByIdWithMembers(1L)).thenReturn(Optional.of(group));

        friendGroupService.deleteGroup(owner, 1L);

        verify(friendGroupRepository).delete(group);
    }

    @Test
    @DisplayName("Should throw exception when non-owner tries to delete")
    void deleteGroup_NotOwner() {
        when(friendGroupRepository.findByIdWithMembers(1L)).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> friendGroupService.deleteGroup(member, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Only the owner can delete this group");
    }

    @Test
    @DisplayName("Should rename group successfully")
    void renameGroup_Success() {
        when(friendGroupRepository.findByIdWithMembers(1L)).thenReturn(Optional.of(group));
        when(friendGroupRepository.save(any(FriendGroup.class))).thenReturn(group);

        FriendGroupResponse result = friendGroupService.renameGroup(owner, 1L, "New Name");

        assertThat(result.getName()).isEqualTo("New Name");
        verify(friendGroupRepository).save(group);
    }

    @Test
    @DisplayName("Should get user groups")
    void getUserGroups_Success() {
        when(friendGroupRepository.findByMember(owner)).thenReturn(List.of(group));

        List<FriendGroupResponse> result = friendGroupService.getUserGroups(owner);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Group");
    }
}
