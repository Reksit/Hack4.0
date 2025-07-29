package com.example.hackathon.dto;

public class GenerateAssessmentRequest {
    private String domain;
    private String difficulty;
    private int numberOfQuestions;

    // Constructors
    public GenerateAssessmentRequest() {}

    // Getters and Setters
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public int getNumberOfQuestions() { return numberOfQuestions; }
    public void setNumberOfQuestions(int numberOfQuestions) { this.numberOfQuestions = numberOfQuestions; }
}