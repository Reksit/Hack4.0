package com.example.hackathon.controller;

import com.example.hackathon.dto.ApiResponse;
import com.example.hackathon.dto.SubmitAssessmentRequest;
import com.example.hackathon.model.Assessment;
import com.example.hackathon.model.AssessmentResult;
import com.example.hackathon.model.Question;
import com.example.hackathon.model.User;
import com.example.hackathon.repository.AssessmentRepository;
import com.example.hackathon.repository.AssessmentResultRepository;
import com.example.hackathon.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assessments")
@CrossOrigin
public class AssessmentController {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentResultRepository assessmentResultRepository;

    @Autowired
    private UserRepository userRepository;

    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

    @PostMapping
    public ResponseEntity<?> createAssessment(@RequestBody Assessment assessment) {
        try {
            // Convert times to IST
            LocalDateTime startTime = LocalDateTime.parse(assessment.getStartTime().replace("Z", ""));
            LocalDateTime endTime = LocalDateTime.parse(assessment.getEndTime().replace("Z", ""));
            
            // Set IST times
            assessment.setStartTime(startTime.toString());
            assessment.setEndTime(endTime.toString());
            assessment.setCreatedAt(LocalDateTime.now(IST_ZONE));
            
            Assessment savedAssessment = assessmentRepository.save(assessment);
            return ResponseEntity.ok(savedAssessment);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to create assessment: " + e.getMessage()));
        }
    }

    @GetMapping("/professor/{professorId}")
    public ResponseEntity<List<Assessment>> getAssessmentsByProfessor(@PathVariable String professorId) {
        List<Assessment> assessments = assessmentRepository.findByCreatedBy(professorId);
        return ResponseEntity.ok(assessments);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Assessment>> getAssessmentsByStudent(@PathVariable String studentId) {
        // Get user email from studentId
        Optional<User> userOpt = userRepository.findById(studentId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.ok(List.of());
        }
        
        String studentEmail = userOpt.get().getEmail();
        List<Assessment> assessments = assessmentRepository.findByAssignedStudentsContaining(studentEmail);
        return ResponseEntity.ok(assessments);
    }

    @PostMapping("/{assessmentId}/submit")
    public ResponseEntity<?> submitAssessment(
            @PathVariable String assessmentId,
            @RequestBody SubmitAssessmentRequest request) {
        try {
            Optional<Assessment> assessmentOpt = assessmentRepository.findById(assessmentId);
            if (!assessmentOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Assessment not found!"));
            }

            Assessment assessment = assessmentOpt.get();
            
            // Calculate score
            int score = 0;
            List<Question> questions = assessment.getQuestions();
            for (int i = 0; i < questions.size() && i < request.getAnswers().size(); i++) {
                if (questions.get(i).getCorrectAnswer() == request.getAnswers().get(i)) {
                    score++;
                }
            }

            // Save result
            AssessmentResult result = new AssessmentResult(
                assessmentId,
                request.getStudentId(),
                request.getAnswers(),
                score
            );
            assessmentResultRepository.save(result);

            return ResponseEntity.ok(new ApiResponse(true, "Assessment submitted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to submit assessment: " + e.getMessage()));
        }
    }

    @GetMapping("/{assessmentId}/results")
    public ResponseEntity<List<AssessmentResult>> getAssessmentResults(@PathVariable String assessmentId) {
        List<AssessmentResult> results = assessmentResultRepository.findByAssessmentId(assessmentId);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/results/student/{studentId}")
    public ResponseEntity<List<AssessmentResult>> getStudentResults(@PathVariable String studentId) {
        List<AssessmentResult> results = assessmentResultRepository.findByStudentId(studentId);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{assessmentId}/status")
    public ResponseEntity<?> getAssessmentStatus(@PathVariable String assessmentId) {
        try {
            Optional<Assessment> assessmentOpt = assessmentRepository.findById(assessmentId);
            if (!assessmentOpt.isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Assessment not found");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            Assessment assessment = assessmentOpt.get();
            LocalDateTime now = LocalDateTime.now(IST_ZONE);
            LocalDateTime start = LocalDateTime.parse(assessment.getStartTime());
            LocalDateTime end = LocalDateTime.parse(assessment.getEndTime());

            String status;
            long timeUntilStart = 0;
            long timeRemaining = 0;
            
            if (now.isBefore(start)) {
                status = "UPCOMING";
                timeUntilStart = java.time.Duration.between(now, start).toMillis();
            } else if (now.isAfter(end)) {
                status = "COMPLETED";
            } else {
                status = "ONGOING";
                timeRemaining = java.time.Duration.between(now, end).toMillis();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", status);
            response.put("startTime", start);
            response.put("endTime", end);
            response.put("currentTime", now);
            response.put("timeUntilStart", timeUntilStart);
            response.put("timeRemaining", timeRemaining);
            response.put("durationMinutes", java.time.Duration.between(start, end).toMinutes());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to get assessment status: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/{assessmentId}")
    public ResponseEntity<?> getAssessment(@PathVariable String assessmentId) {
        try {
            Optional<Assessment> assessmentOpt = assessmentRepository.findById(assessmentId);
            if (!assessmentOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Assessment not found!"));
            }
            return ResponseEntity.ok(assessmentOpt.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to get assessment: " + e.getMessage()));
        }
    }

    @GetMapping("/{assessmentId}/submission/{studentId}")
    public ResponseEntity<?> checkSubmission(@PathVariable String assessmentId, @PathVariable String studentId) {
        try {
            AssessmentResult result = assessmentResultRepository.findByAssessmentIdAndStudentId(assessmentId, studentId);
            Map<String, Object> response = new HashMap<>();
            response.put("hasSubmitted", result != null);
            if (result != null) {
                response.put("submissionTime", result.getCompletedAt());
                response.put("score", result.getScore());
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to check submission: " + e.getMessage()));
        }
    }

    @GetMapping("/{assessmentId}/results-with-students")
    public ResponseEntity<?> getAssessmentResultsWithStudents(@PathVariable String assessmentId) {
        try {
            List<AssessmentResult> results = assessmentResultRepository.findByAssessmentId(assessmentId);
            
            // Enhance results with student information
            List<Map<String, Object>> enhancedResults = results.stream().map(result -> {
                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("id", result.getId());
                resultMap.put("assessmentId", result.getAssessmentId());
                resultMap.put("studentId", result.getStudentId());
                resultMap.put("answers", result.getAnswers());
                resultMap.put("score", result.getScore());
                resultMap.put("completedAt", result.getCompletedAt());
                
                // Get student information
                Optional<User> studentOpt = userRepository.findById(result.getStudentId());
                if (studentOpt.isPresent()) {
                    User student = studentOpt.get();
                    resultMap.put("studentName", student.getUsername());
                    resultMap.put("studentEmail", student.getEmail());
                }
                
                return resultMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(enhancedResults);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to get assessment results: " + e.getMessage()));
        }
    }
}