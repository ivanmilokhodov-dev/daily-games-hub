package com.dailygames.hub.model;

public enum GameType {
    WORDLE("Wordle", "https://www.nytimes.com/games/wordle/index.html", "Guess the 5-letter word in 6 tries"),
    CONNECTIONS("Connections", "https://www.nytimes.com/games/connections", "Group 16 words into 4 categories"),
    CONTEXTO("Contexto", "https://contexto.me/", "Guess the word using semantic similarity"),
    MINI_CROSSWORD("Mini Crossword", "https://www.nytimes.com/crosswords/game/mini", "Quick daily crossword puzzle"),
    STRANDS("Strands", "https://www.nytimes.com/games/strands", "Find themed words in a letter grid"),
    SPELLING_BEE("Spelling Bee", "https://www.nytimes.com/puzzles/spelling-bee", "Make words from 7 letters"),
    QUORDLE("Quordle", "https://www.merriam-webster.com/games/quordle/", "Guess 4 words at once"),
    NERDLE("Nerdle", "https://nerdlegame.com/", "Math equation guessing game");

    private final String displayName;
    private final String url;
    private final String description;

    GameType(String displayName, String url, String description) {
        this.displayName = displayName;
        this.url = url;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getUrl() {
        return url;
    }

    public String getDescription() {
        return description;
    }
}
