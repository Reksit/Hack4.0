package com.example.hackathon.dto;

import java.util.List;
import java.util.Map;

public class EvaluateAnswersRequest {
    private String domain;
    private String difficulty;
    private List<Map<String, Object>> questions;
    private List<Integer> answers;

    // Constructors
    public EvaluateAnswersRequest() {}

    // Getters and Setters
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public List<Map<String, Object>> getQuestions() { return questions; }
    public void setQuestions(List<Map<String, Object>> questions) { this.questions = questions; }

    public List<Integer> getAnswers() { return answers; }
    public void setAnswers(List<Integer> answers) { this.answers = answers; }
}