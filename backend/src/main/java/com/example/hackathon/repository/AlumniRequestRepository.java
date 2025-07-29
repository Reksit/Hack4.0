package com.example.hackathon.repository;

import com.example.hackathon.model.AlumniRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlumniRequestRepository extends MongoRepository<AlumniRequest, String> {
    List<AlumniRequest> findByProfessorIdAndStatus(String professorId, AlumniRequest.RequestStatus status);
    List<AlumniRequest> findByAlumniId(String alumniId);
}