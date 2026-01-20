package com.dailygames.hub.repository;

import com.dailygames.hub.model.FriendGroup;
import com.dailygames.hub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendGroupRepository extends JpaRepository<FriendGroup, Long> {

    @Query("SELECT fg FROM FriendGroup fg LEFT JOIN FETCH fg.members LEFT JOIN FETCH fg.owner WHERE fg.inviteCode = :inviteCode")
    Optional<FriendGroup> findByInviteCode(@Param("inviteCode") String inviteCode);

    @Query("SELECT DISTINCT fg FROM FriendGroup fg LEFT JOIN FETCH fg.members LEFT JOIN FETCH fg.owner WHERE :user MEMBER OF fg.members")
    List<FriendGroup> findByMember(@Param("user") User user);

    @Query("SELECT fg FROM FriendGroup fg LEFT JOIN FETCH fg.members LEFT JOIN FETCH fg.owner WHERE fg.id = :id")
    Optional<FriendGroup> findByIdWithMembers(@Param("id") Long id);

    List<FriendGroup> findByOwner(User owner);
}
