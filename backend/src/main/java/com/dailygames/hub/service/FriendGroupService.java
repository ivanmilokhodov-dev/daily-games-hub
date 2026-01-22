package com.dailygames.hub.service;

import com.dailygames.hub.dto.FriendGroupRequest;
import com.dailygames.hub.dto.FriendGroupResponse;
import com.dailygames.hub.model.FriendGroup;
import com.dailygames.hub.model.Score;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.FriendGroupRepository;
import com.dailygames.hub.repository.ScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendGroupService {

    private final FriendGroupRepository friendGroupRepository;
    private final ScoreRepository scoreRepository;

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
        FriendGroup group = friendGroupRepository.findByIdWithMembers(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (group.getOwner().equals(user)) {
            throw new IllegalArgumentException("Owner cannot leave the group. Delete the group instead.");
        }

        group.getMembers().remove(user);
        friendGroupRepository.save(group);
    }

    @Transactional
    public void deleteGroup(User user, Long groupId) {
        FriendGroup group = friendGroupRepository.findByIdWithMembers(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getOwner().equals(user)) {
            throw new IllegalArgumentException("Only the owner can delete this group");
        }

        // Remove the group from all members' friendGroups set (bidirectional sync)
        for (User member : new HashSet<>(group.getMembers())) {
            member.getFriendGroups().remove(group);
        }

        // Clear members from this group
        group.getMembers().clear();

        // Flush to ensure junction table is cleared before delete
        friendGroupRepository.saveAndFlush(group);

        // Now delete the group
        friendGroupRepository.delete(group);
    }

    @Transactional(readOnly = true)
    public List<FriendGroupResponse> getUserGroups(User user) {
        return friendGroupRepository.findByMember(user).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FriendGroup getGroupById(Long groupId) {
        return friendGroupRepository.findByIdWithMembers(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
    }

    @Transactional(readOnly = true)
    public List<User> getGroupMembers(Long groupId) {
        FriendGroup group = friendGroupRepository.findByIdWithMembers(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        return List.copyOf(group.getMembers());
    }

    @Transactional
    public FriendGroupResponse renameGroup(User user, Long groupId, String newName) {
        FriendGroup group = friendGroupRepository.findByIdWithMembers(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getOwner().equals(user)) {
            throw new IllegalArgumentException("Only the owner can rename this group");
        }

        group.setName(newName);
        FriendGroup saved = friendGroupRepository.save(group);
        return mapToResponse(saved);
    }

    @Transactional
    public FriendGroupResponse removeMember(User owner, Long groupId, Long memberId) {
        FriendGroup group = friendGroupRepository.findByIdWithMembers(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getOwner().equals(owner)) {
            throw new IllegalArgumentException("Only the owner can remove members");
        }

        User memberToRemove = group.getMembers().stream()
            .filter(m -> m.getId().equals(memberId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Member not found in group"));

        if (memberToRemove.equals(owner)) {
            throw new IllegalArgumentException("Owner cannot be removed from the group");
        }

        group.getMembers().remove(memberToRemove);
        memberToRemove.getFriendGroups().remove(group);
        FriendGroup saved = friendGroupRepository.save(group);
        return mapToResponse(saved);
    }

    @Transactional
    public void updateGroupStreak(Long groupId, LocalDate gameDate) {
        FriendGroup group = friendGroupRepository.findByIdWithMembers(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        LocalDate lastActive = group.getLastActiveDate();

        if (lastActive == null) {
            group.setGroupStreak(1);
            group.setLongestGroupStreak(1);
            group.setLastActiveDate(gameDate);
        } else if (lastActive.equals(gameDate)) {
            // Already counted for this date
            return;
        } else if (gameDate.isBefore(lastActive)) {
            // Submitting for an older date - don't change streak or lastActiveDate
            return;
        } else if (lastActive.plusDays(1).equals(gameDate)) {
            // Consecutive day
            group.setGroupStreak(group.getGroupStreak() + 1);
            if (group.getGroupStreak() > group.getLongestGroupStreak()) {
                group.setLongestGroupStreak(group.getGroupStreak());
            }
            group.setLastActiveDate(gameDate);
        } else {
            // Streak broken (gap of more than 1 day)
            group.setGroupStreak(1);
            group.setLastActiveDate(gameDate);
        }

        friendGroupRepository.save(group);
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
        response.setOwnerId(group.getOwner().getId());
        response.setCreatedAt(group.getCreatedAt());

        // Calculate streak dynamically from actual scores
        int calculatedStreak = calculateGroupStreakFromScores(group);
        response.setGroupStreak(calculatedStreak);
        response.setLongestGroupStreak(Math.max(group.getLongestGroupStreak(), calculatedStreak));

        List<FriendGroupResponse.MemberInfo> memberList = group.getMembers().stream()
            .map(member -> {
                FriendGroupResponse.MemberInfo info = new FriendGroupResponse.MemberInfo();
                info.setId(member.getId());
                info.setUsername(member.getUsername());
                info.setDisplayName(member.getDisplayName());
                info.setGlobalDayStreak(member.getGlobalDayStreak());
                return info;
            })
            .collect(Collectors.toList());
        response.setMembers(memberList);
        response.setMemberCount(memberList.size());

        // Calculate group stats
        response.setStats(calculateGroupStats(group));

        return response;
    }

    private int calculateGroupStreakFromScores(FriendGroup group) {
        List<User> members = new ArrayList<>(group.getMembers());
        if (members.isEmpty()) {
            return 0;
        }

        // Get all distinct dates when any group member played
        List<LocalDate> activeDates = scoreRepository.findDistinctDatesByUsers(members);
        if (activeDates.isEmpty()) {
            return 0;
        }

        // Sort dates ascending
        List<LocalDate> sortedDates = activeDates.stream()
            .sorted()
            .collect(Collectors.toList());

        // Calculate the longest consecutive streak by checking actual dates
        int longestStreak = 1;
        int currentStreak = 1;

        for (int i = 1; i < sortedDates.size(); i++) {
            LocalDate prevDate = sortedDates.get(i - 1);
            LocalDate currDate = sortedDates.get(i);

            // Check if dates are consecutive (exactly 1 day apart)
            if (prevDate.plusDays(1).equals(currDate)) {
                currentStreak++;
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            } else {
                currentStreak = 1;
            }
        }

        return longestStreak;
    }

    private FriendGroupResponse.GroupStats calculateGroupStats(FriendGroup group) {
        FriendGroupResponse.GroupStats stats = new FriendGroupResponse.GroupStats();
        LocalDate today = LocalDate.now();
        List<User> members = new ArrayList<>(group.getMembers());

        if (members.isEmpty()) {
            return stats;
        }

        // Get today's scores for all members
        List<Score> todayScores = scoreRepository.findByUsersAndDate(members, today);

        // Most active today (most games played)
        Map<User, Long> gamesPerUser = todayScores.stream()
            .collect(Collectors.groupingBy(Score::getUser, Collectors.counting()));

        if (!gamesPerUser.isEmpty()) {
            Map.Entry<User, Long> mostActive = gamesPerUser.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);
            if (mostActive != null) {
                stats.setMostActiveToday(mostActive.getKey().getDisplayName() != null ?
                    mostActive.getKey().getDisplayName() : mostActive.getKey().getUsername());
                stats.setMostActiveTodayGames(mostActive.getValue().intValue());
            }
        }

        stats.setTotalGamesToday(todayScores.size());

        // Longest streak among members
        User longestStreakUser = members.stream()
            .max(Comparator.comparingInt(User::getGlobalDayStreak))
            .orElse(null);
        if (longestStreakUser != null && longestStreakUser.getGlobalDayStreak() > 0) {
            stats.setLongestStreak(longestStreakUser.getDisplayName() != null ?
                longestStreakUser.getDisplayName() : longestStreakUser.getUsername());
            stats.setLongestStreakDays(longestStreakUser.getGlobalDayStreak());
        }

        // Returning player (played today after not playing yesterday)
        for (User member : members) {
            LocalDate lastActive = member.getLastActiveDate();
            if (lastActive != null && lastActive.equals(today)) {
                // Check if they were inactive for more than 1 day before today
                List<Score> recentScores = scoreRepository.findRecentByUser(member.getId());
                if (recentScores.size() >= 2) {
                    LocalDate secondLastDate = recentScores.stream()
                        .map(Score::getGameDate)
                        .distinct()
                        .sorted(Comparator.reverseOrder())
                        .skip(1)
                        .findFirst()
                        .orElse(null);
                    if (secondLastDate != null && !secondLastDate.equals(today.minusDays(1))) {
                        stats.setReturningPlayer(member.getDisplayName() != null ?
                            member.getDisplayName() : member.getUsername());
                        break;
                    }
                }
            }
        }

        return stats;
    }
}
