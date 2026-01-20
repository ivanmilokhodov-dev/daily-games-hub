package com.dailygames.hub.repository;

import com.dailygames.hub.model.Friendship;
import com.dailygames.hub.model.Friendship.FriendshipStatus;
import com.dailygames.hub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByUserAndFriend(User user, User friend);

    @Query("SELECT f FROM Friendship f WHERE (f.user = :user OR f.friend = :user) AND f.status = :status")
    List<Friendship> findByUserOrFriendAndStatus(@Param("user") User user, @Param("status") FriendshipStatus status);

    @Query("SELECT f FROM Friendship f WHERE f.friend = :user AND f.status = 'PENDING'")
    List<Friendship> findPendingRequestsForUser(@Param("user") User user);

    @Query("SELECT f FROM Friendship f WHERE f.user = :user AND f.status = 'PENDING'")
    List<Friendship> findSentRequestsByUser(@Param("user") User user);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Friendship f " +
           "WHERE ((f.user = :user1 AND f.friend = :user2) OR (f.user = :user2 AND f.friend = :user1)) " +
           "AND f.status = 'ACCEPTED'")
    boolean areFriends(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT f FROM Friendship f WHERE " +
           "((f.user = :user1 AND f.friend = :user2) OR (f.user = :user2 AND f.friend = :user1))")
    Optional<Friendship> findFriendshipBetween(@Param("user1") User user1, @Param("user2") User user2);
}
