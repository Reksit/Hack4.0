package com.example.hackathon.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "alumni_requests")
public class AlumniRequest {
    @Id
    private String id;
    
    private String alumniId;
    private String alumniUsername;
    private String alumniEmail;
    private String professorId;
    private String professorEmail;
    private RequestStatus status = RequestStatus.PENDING;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum RequestStatus {
        PENDING, APPROVED, REJECTED
    }

    // Constructors
    public AlumniRequest() {}

    public AlumniRequest(String alumniId, String alumniUsername, String alumniEmail, 
                        String professorId, String professorEmail) {
        this.alumniId = alumniId;
        this.alumniUsername = alumniUsername;
        this.alumniEmail = alumniEmail;
        this.professorId = professorId;
        this.professorEmail = professorEmail;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAlumniId() { return alumniId; }
    public void setAlumniId(String alumniId) { this.alumniId = alumniId; }

    public String getAlumniUsername() { return alumniUsername; }
    public void setAlumniUsername(String alumniUsername) { this.alumniUsername = alumniUsername; }

    public String getAlumniEmail() { return alumniEmail; }
    public void setAlumniEmail(String alumniEmail) { this.alumniEmail = alumniEmail; }

    public String getProfessorId() { return professorId; }
    public void setProfessorId(String professorId) { this.professorId = professorId; }

    public String getProfessorEmail() { return professorEmail; }
    public void setProfessorEmail(String professorEmail) { this.professorEmail = professorEmail; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}