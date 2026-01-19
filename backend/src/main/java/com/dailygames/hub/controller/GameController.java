package com.dailygames.hub.controller;

import com.dailygames.hub.model.GameType;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/games")
public class GameController {

    @GetMapping
    public ResponseEntity<List<GameInfo>> getAllGames() {
        List<GameInfo> games = Arrays.stream(GameType.values())
            .map(game -> {
                GameInfo info = new GameInfo();
                info.setId(game.name());
                info.setName(game.getDisplayName());
                info.setUrl(game.getUrl());
                info.setDescription(game.getDescription());
                return info;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(games);
    }

    @Data
    public static class GameInfo {
        private String id;
        private String name;
        private String url;
        private String description;
    }
}
