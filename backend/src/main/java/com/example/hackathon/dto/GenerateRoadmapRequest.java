package com.example.hackathon.dto;

public class GenerateRoadmapRequest {
    private String domain;
    private String timeframe;
    private String difficulty;

    // Constructors
    public GenerateRoadmapRequest() {}

    // Getters and Setters
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getTimeframe() { return timeframe; }
    public void setTimeframe(String timeframe) { this.timeframe = timeframe; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
}