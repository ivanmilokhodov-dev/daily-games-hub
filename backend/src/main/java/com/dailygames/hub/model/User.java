package com.dailygames.hub.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String displayName;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Global day streak - consecutive days playing at least one game
    @Column(nullable = false)
    private Integer globalDayStreak = 0;

    @Column(nullable = false)
    private Integer longestGlobalStreak = 0;

    private java.time.LocalDate lastActiveDate;

    // Average rating across all games
    @Column(nullable = false)
    private Integer averageRating = 1000;

    @ManyToMany(mappedBy = "members")
    private Set<FriendGroup> friendGroups = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private Set<Score> scores = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private Set<Streak> streaks = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private Set<Rating> ratings = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return id != null && Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
