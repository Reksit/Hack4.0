package com.example.hackathon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AIService {

    @Value("${google.ai.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<String> generateRoadmap(String domain, String timeframe, String difficulty) {
        try {
            String prompt = String.format(
                "Create a detailed learning roadmap for %s with %s difficulty level to be completed in %s. " +
                "Provide exactly 10 specific, actionable steps that progressively build knowledge and skills. " +
                "Each step should be clear, practical, and include specific topics or technologies to learn. " +
                "Format as a numbered list with detailed descriptions for each step. " +
                "Make it comprehensive and tailored to the difficulty level.",
                domain, difficulty.toLowerCase(), timeframe
            );

            String aiResponse = callGeminiAPI(prompt);
            List<String> roadmap = parseRoadmapResponse(aiResponse);
            
            // Ensure we have content from AI
            if (roadmap.isEmpty()) {
                throw new RuntimeException("AI did not generate valid roadmap content");
            }
            
            return roadmap;
        } catch (Exception e) {
            System.err.println("AI API Error: " + e.getMessage());
            throw new RuntimeException("Failed to generate AI roadmap: " + e.getMessage());
        }
    }

    public Map<String, Object> generateAssessment(String domain, String difficulty, int numberOfQuestions) {
        try {
            String prompt = String.format(
                "Generate exactly %d multiple choice questions about %s at %s difficulty level. " +
                "For each question, provide: " +
                "1. A clear, specific question about %s concepts " +
                "2. Exactly four answer options labeled A, B, C, D " +
                "3. Indicate which option (A, B, C, or D) is correct " +
                "4. Make questions practical and test real understanding " +
                "5. Ensure questions are appropriate for %s difficulty level " +
                "Format your response as follows for each question: " +
                "Question X: [question text] " +
                "A) [option A] " +
                "B) [option B] " +
                "C) [option C] " +
                "D) [option D] " +
                "Correct Answer: [A/B/C/D] " +
                "Please generate all %d questions in this exact format.",
                numberOfQuestions, domain, difficulty.toLowerCase(), domain, difficulty.toLowerCase(), numberOfQuestions
            );

            String aiResponse = callGeminiAPI(prompt);
            Map<String, Object> assessment = parseAssessmentResponse(aiResponse);
            
            // Ensure we have valid questions from AI
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) assessment.get("questions");
            if (questions == null || questions.isEmpty()) {
                throw new RuntimeException("AI did not generate valid assessment questions");
            }
            
            return assessment;
        } catch (Exception e) {
            System.err.println("AI API Error: " + e.getMessage());
            throw new RuntimeException("Failed to generate AI assessment: " + e.getMessage());
        }
    }

    public String explainAnswer(String question, String correctAnswer) {
        try {
            String prompt = String.format(
                "Explain why '%s' is the correct answer to the question: '%s'. " +
                "Provide a detailed explanation that helps the student understand the concept. " +
                "Include key points, reasoning, and any relevant background information. " +
                "Make it educational and easy to understand. " +
                "Provide at least 3-4 sentences of explanation.",
                correctAnswer, question
            );

            String explanation = callGeminiAPI(prompt);
            if (explanation == null || explanation.trim().isEmpty()) {
                throw new RuntimeException("AI did not generate valid explanation");
            }
            
            return explanation;
        } catch (Exception e) {
            System.err.println("AI API Error: " + e.getMessage());
            throw new RuntimeException("Failed to generate AI explanation: " + e.getMessage());
        }
    }

    public Map<String, Object> evaluateAnswers(Map<String, Object> evaluationData) {
        try {
            String domain = (String) evaluationData.get("domain");
            String difficulty = (String) evaluationData.get("difficulty");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) evaluationData.get("questions");
            @SuppressWarnings("unchecked")
            List<Integer> answers = (List<Integer>) evaluationData.get("answers");

            // Calculate score and wrong answers
            int score = 0;
            List<Map<String, Object>> wrongAnswers = new ArrayList<>();

            for (int i = 0; i < questions.size() && i < answers.size(); i++) {
                Map<String, Object> question = questions.get(i);
                int userAnswer = answers.get(i);
                int correctAnswer = (Integer) question.get("correctAnswer");
                
                if (userAnswer == correctAnswer) {
                    score++;
                } else {
                    @SuppressWarnings("unchecked")
                    List<String> options = (List<String>) question.get("options");
                    Map<String, Object> wrongAnswer = new HashMap<>();
                    wrongAnswer.put("question", question.get("question"));
                    wrongAnswer.put("userAnswer", userAnswer >= 0 && userAnswer < options.size() ? options.get(userAnswer) : "No answer");
                    wrongAnswer.put("correctAnswer", options.get(correctAnswer));
                    
                    // Get AI explanation for wrong answer
                    String explanation = explainAnswer((String) question.get("question"), options.get(correctAnswer));
                    wrongAnswer.put("explanation", explanation);
                    wrongAnswers.add(wrongAnswer);
                }
            }

            // Get AI feedback
            String feedbackPrompt = String.format(
                "Provide detailed feedback for a student who scored %d out of %d on a %s difficulty %s assessment. " +
                "The student got %.1f%% correct. " +
                "Provide: " +
                "1. Overall performance assessment " +
                "2. What this score indicates about their understanding " +
                "3. Specific recommendations for improvement " +
                "4. Encouragement and next steps " +
                "Be constructive, specific, and encouraging. Write 4-5 sentences.",
                score, questions.size(), difficulty.toLowerCase(), domain, 
                (double) score / questions.size() * 100
            );

            String feedback = callGeminiAPI(feedbackPrompt);
            
            // Get AI-generated strengths and improvements
            String strengthsPrompt = String.format(
                "Based on a score of %d out of %d (%.1f%%) on a %s %s assessment, " +
                "list 3 specific strengths this student has demonstrated. " +
                "Format as a simple list, one strength per line.",
                score, questions.size(), (double) score / questions.size() * 100, 
                difficulty.toLowerCase(), domain
            );
            
            String improvementsPrompt = String.format(
                "Based on a score of %d out of %d (%.1f%%) on a %s %s assessment, " +
                "list 3 specific areas for improvement. " +
                "Format as a simple list, one improvement area per line.",
                score, questions.size(), (double) score / questions.size() * 100, 
                difficulty.toLowerCase(), domain
            );

            String strengthsResponse = callGeminiAPI(strengthsPrompt);
            String improvementsResponse = callGeminiAPI(improvementsPrompt);
            
            List<String> strengths = parseListResponse(strengthsResponse);
            List<String> improvements = parseListResponse(improvementsResponse);
            
            Map<String, Object> result = new HashMap<>();
            result.put("score", score);
            result.put("totalQuestions", questions.size());
            result.put("feedback", feedback);
            result.put("detailedFeedback", generateDetailedFeedback(score, questions.size(), domain));
            result.put("wrongAnswers", wrongAnswers);
            result.put("strengths", strengths);
            result.put("improvements", improvements);
            
            return result;
        } catch (Exception e) {
            System.err.println("AI API Error: " + e.getMessage());
            throw new RuntimeException("Failed to generate AI evaluation: " + e.getMessage());
        }
    }

    private String callGeminiAPI(String prompt) throws Exception {
        // Updated to use the correct Gemini 2.0 Flash endpoint
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-goog-api-key", apiKey);
        
        // Updated request format for Gemini 2.0 Flash
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, String> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", Arrays.asList(part));
        requestBody.put("contents", Arrays.asList(content));
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                
                // Updated response parsing for Gemini 2.0 Flash
                JsonNode candidates = jsonResponse.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode firstCandidate = candidates.get(0);
                    JsonNode content = firstCandidate.path("content");
                    JsonNode parts = content.path("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        String aiText = parts.get(0).path("text").asText();
                        
                        if (aiText == null || aiText.trim().isEmpty()) {
                            throw new RuntimeException("AI returned empty response");
                        }
                        
                        return aiText;
                    }
                }
                
                throw new RuntimeException("Invalid response structure from Gemini API");
            } else {
                throw new RuntimeException("Failed to get response from Gemini API: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("Gemini API call failed: " + e.getMessage());
            throw new RuntimeException("Gemini API call failed: " + e.getMessage());
        }
    }

    private List<String> parseRoadmapResponse(String aiResponse) {
        List<String> roadmap = new ArrayList<>();
        String[] lines = aiResponse.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            if (!line.isEmpty()) {
                // Remove numbering and bullet points
                line = line.replaceFirst("^\\d+\\.\\s*", "")
                          .replaceFirst("^[•-]\\s*", "")
                          .replaceFirst("^\\*\\s*", "");
                
                if (!line.isEmpty() && line.length() > 10) {
                    roadmap.add(line);
                }
            }
        }
        
        return roadmap;
    }

    private Map<String, Object> parseAssessmentResponse(String aiResponse) {
        List<Map<String, Object>> questions = new ArrayList<>();
        String[] lines = aiResponse.split("\n");
        
        Map<String, Object> currentQuestion = null;
        List<String> currentOptions = new ArrayList<>();
        String currentQuestionText = "";
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;
            
            // Check if it's a question
            if (line.matches("^Question \\d+:.*") || (line.contains("?") && !line.matches("^[A-D]\\).*"))) {
                // Save previous question if exists
                if (currentQuestion != null && !currentOptions.isEmpty()) {
                    currentQuestion.put("options", new ArrayList<>(currentOptions));
                    questions.add(currentQuestion);
                }
                
                // Start new question
                currentQuestion = new HashMap<>();
                currentQuestion.put("id", "q" + questions.size());
                currentQuestionText = line.replaceFirst("^Question \\d+:\\s*", "");
                currentQuestion.put("question", currentQuestionText);
                currentOptions.clear();
                currentQuestion.put("correctAnswer", 0); // Default
            }
            // Check if it's an option
            else if (line.matches("^[A-D]\\).*")) {
                String option = line.replaceFirst("^[A-D]\\)\\s*", "");
                currentOptions.add(option);
            }
            // Check if it's correct answer
            else if (line.matches("^Correct Answer:\\s*[A-D]")) {
                String correctLetter = line.replaceFirst("^Correct Answer:\\s*", "");
                int correctIndex = correctLetter.charAt(0) - 'A';
                if (currentQuestion != null) {
                    currentQuestion.put("correctAnswer", correctIndex);
                }
            }
        }
        
        // Add the last question
        if (currentQuestion != null && !currentOptions.isEmpty()) {
            currentQuestion.put("options", new ArrayList<>(currentOptions));
            questions.add(currentQuestion);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("questions", questions);
        return result;
    }

    private List<String> parseListResponse(String aiResponse) {
        List<String> items = new ArrayList<>();
        String[] lines = aiResponse.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            if (!line.isEmpty()) {
                // Remove numbering and bullet points
                line = line.replaceFirst("^\\d+\\.\\s*", "")
                          .replaceFirst("^[•-]\\s*", "")
                          .replaceFirst("^\\*\\s*", "");
                
                if (!line.isEmpty() && line.length() > 5) {
                    items.add(line);
                }
            }
        }
        
        return items;
    }

    private String generateDetailedFeedback(int score, int total, String domain) {
        double percentage = (double) score / total * 100;
        if (percentage >= 80) {
            return "Excellent performance! You have a strong understanding of " + domain + " concepts.";
        } else if (percentage >= 60) {
            return "Good work! You have a solid foundation in " + domain + " with room for improvement.";
        } else {
            return "Keep practicing! Focus on strengthening your understanding of " + domain + " fundamentals.";
        }
    }
}