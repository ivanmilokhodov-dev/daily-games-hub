package com.dailygames.hub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "streaks", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "game_type"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Streak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameType gameType;

    @Column(nullable = false)
    private Integer currentStreak = 0;

    @Column(nullable = false)
    private Integer longestStreak = 0;

    private LocalDate lastPlayedDate;
}
