package com.example.hackathon.controller;

import com.example.hackathon.dto.ApiResponse;
import com.example.hackathon.dto.SendMessageRequest;
import com.example.hackathon.dto.UserResponse;
import com.example.hackathon.model.ChatMessage;
import com.example.hackathon.model.User;
import com.example.hackathon.repository.ChatMessageRepository;
import com.example.hackathon.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request) {
        try {
            ChatMessage message = new ChatMessage(
                request.getSenderId(),
                request.getReceiverId(),
                request.getMessage()
            );
            chatMessageRepository.save(message);
            return ResponseEntity.ok(new ApiResponse(true, "Message sent successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to send message: " + e.getMessage()));
        }
    }

    @GetMapping("/messages/{userId1}/{userId2}")
    public ResponseEntity<List<ChatMessage>> getMessages(
            @PathVariable String userId1,
            @PathVariable String userId2) {
        List<ChatMessage> messages = chatMessageRepository.findMessagesBetweenUsers(userId1, userId2);
        return ResponseEntity.ok(messages);
    }
}