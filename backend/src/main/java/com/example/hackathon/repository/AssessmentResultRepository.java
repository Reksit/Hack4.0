package com.example.hackathon.repository;

import com.example.hackathon.model.AssessmentResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentResultRepository extends MongoRepository<AssessmentResult, String> {
    List<AssessmentResult> findByAssessmentId(String assessmentId);
    List<AssessmentResult> findByStudentId(String studentId);
    AssessmentResult findByAssessmentIdAndStudentId(String assessmentId, String studentId);
}