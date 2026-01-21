package com.dailygames.hub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "scores", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "game_type", "game_date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Score {

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
    private LocalDate gameDate;

    @Column(length = 2000)
    private String rawResult;

    private Integer attempts;

    private Boolean solved;

    private Integer score;

    private Integer timeSeconds;

    private Integer ratingChange;

    @Column(nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();
}
