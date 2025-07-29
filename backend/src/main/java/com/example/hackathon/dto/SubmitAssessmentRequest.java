package com.example.hackathon.dto;

import java.util.List;

public class SubmitAssessmentRequest {
    private String studentId;
    private List<Integer> answers;

    // Constructors
    public SubmitAssessmentRequest() {}

    // Getters and Setters
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public List<Integer> getAnswers() { return answers; }
    public void setAnswers(List<Integer> answers) { this.answers = answers; }
}