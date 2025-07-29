package com.example.hackathon.dto;

public class ExplainAnswerRequest {
    private String question;
    private String correctAnswer;

    // Constructors
    public ExplainAnswerRequest() {}

    // Getters and Setters
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
}