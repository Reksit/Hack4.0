package com.example.hackathon.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "assessment_results")
public class AssessmentResult {
    @Id
    private String id;
    
    private String assessmentId;
    private String studentId;
    private List<Integer> answers;
    private int score;
    private LocalDateTime completedAt = LocalDateTime.now();

    // Constructors
    public AssessmentResult() {}

    public AssessmentResult(String assessmentId, String studentId, List<Integer> answers, int score) {
        this.assessmentId = assessmentId;
        this.studentId = studentId;
        this.answers = answers;
        this.score = score;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public List<Integer> getAnswers() { return answers; }
    public void setAnswers(List<Integer> answers) { this.answers = answers; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}