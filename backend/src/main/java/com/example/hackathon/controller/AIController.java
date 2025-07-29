package com.example.hackathon.controller;

import com.example.hackathon.dto.GenerateAssessmentRequest;
import com.example.hackathon.dto.GenerateRoadmapRequest;
import com.example.hackathon.dto.ExplainAnswerRequest;
import com.example.hackathon.dto.EvaluateAnswersRequest;
import com.example.hackathon.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/roadmap")
    public ResponseEntity<Map<String, Object>> generateRoadmap(@RequestBody GenerateRoadmapRequest request) {
        List<String> roadmap = aiService.generateRoadmap(
            request.getDomain(),
            request.getTimeframe(),
            request.getDifficulty()
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("roadmap", roadmap);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/assessment")
    public ResponseEntity<Map<String, Object>> generateAssessment(@RequestBody GenerateAssessmentRequest request) {
        Map<String, Object> assessment = aiService.generateAssessment(
            request.getDomain(),
            request.getDifficulty(),
            request.getNumberOfQuestions()
        );
        return ResponseEntity.ok(assessment);
    }

    @PostMapping("/explain")
    public ResponseEntity<Map<String, Object>> explainAnswer(@RequestBody ExplainAnswerRequest request) {
        String explanation = aiService.explainAnswer(request.getQuestion(), request.getCorrectAnswer());
        
        Map<String, Object> response = new HashMap<>();
        response.put("explanation", explanation);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, Object>> evaluateAnswers(@RequestBody Map<String, Object> evaluationData) {
        Map<String, Object> evaluation = aiService.evaluateAnswers(evaluationData);
        return ResponseEntity.ok(evaluation);
    }
}