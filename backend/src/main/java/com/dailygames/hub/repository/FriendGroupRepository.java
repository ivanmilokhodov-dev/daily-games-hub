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

    Optional<FriendGroup> findByInviteCode(String inviteCode);

    @Query("SELECT fg FROM FriendGroup fg WHERE :user MEMBER OF fg.members")
    List<FriendGroup> findByMember(@Param("user") User user);

    List<FriendGroup> findByOwner(User owner);
}
