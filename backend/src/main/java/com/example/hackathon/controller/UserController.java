package com.example.hackathon.controller;

import com.example.hackathon.dto.UserResponse;
import com.example.hackathon.model.User;
import com.example.hackathon.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String q) {
        List<User> users = userRepository.findByUsernameOrEmailContainingIgnoreCase(q);
        List<UserResponse> userResponses = users.stream()
            .filter(user -> user.isVerified() && (user.getRole() != User.Role.ALUMNI || user.isApproved()))
            .map(UserResponse::new)
            .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }
}