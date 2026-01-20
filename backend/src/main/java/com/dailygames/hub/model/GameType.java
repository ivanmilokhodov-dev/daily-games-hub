package com.dailygames.hub.model;

public enum GameType {
    WORDLE("Wordle", "https://www.nytimes.com/games/wordle", "Guess the 5-letter word in 6 tries"),
    CONNECTIONS("Connections", "https://www.nytimes.com/games/connections", "Group 16 words into 4 categories"),
    CONTEXTO("Contexto", "https://contexto.me/", "Guess the word using semantic similarity"),
    SEMANTLE("Semantle", "https://semantle.com/", "Guess the word using word2vec similarity"),
    HORSE("Horse", "https://enclose.horse/", "Claim the maximum territory with the number of walls given"),
    TRAVLE("Travle", "https://travle.earth/", "Find the path between two countries"),
    WORLDLE("Worldle", "https://worldle.teuteuf.fr/", "Guess the country from its shape"),
    MINUTE_CRYPTIC("Minute Cryptic", "https://www.minutecryptic.com/", "Solve a cryptic crossword clue in under a minute"),
    COUNTRYLE("Countryle", "https://countryle.com/", "Guess the country from clues"),
    SPOTLE("Spotle", "https://spotle.io/", "Guess the artist from their top Spotify songs"),
    BANDLE("Bandle", "https://bandle.app/", "Guess the song from increasing audio clips");

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
