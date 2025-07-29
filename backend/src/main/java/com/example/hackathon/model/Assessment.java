package com.example.hackathon.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "assessments")
public class Assessment {
    @Id
    private String id;
    
    private String title;
    private String description;
    private List<Question> questions;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String createdBy; // Professor ID
    private List<String> assignedStudents;
    private AssessmentStatus status = AssessmentStatus.SCHEDULED;
    private LocalDateTime createdAt = LocalDateTime.now();
    private int durationMinutes; // Duration in minutes
    private boolean allowLateSubmission = false;

    public enum AssessmentStatus {
        SCHEDULED, ONGOING, COMPLETED
    }

    // Constructors
    public Assessment() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public List<String> getAssignedStudents() { return assignedStudents; }
    public void setAssignedStudents(List<String> assignedStudents) { this.assignedStudents = assignedStudents; }

    public AssessmentStatus getStatus() { return status; }
    public void setStatus(AssessmentStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}