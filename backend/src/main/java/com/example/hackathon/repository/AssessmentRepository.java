package com.example.hackathon.repository;

import com.example.hackathon.model.Assessment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends MongoRepository<Assessment, String> {
    List<Assessment> findByCreatedBy(String professorId);
    List<Assessment> findByAssignedStudentsContaining(String studentId);
}