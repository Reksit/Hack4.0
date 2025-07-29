package com.example.hackathon.controller;

import com.example.hackathon.dto.ApiResponse;
import com.example.hackathon.model.AlumniRequest;
import com.example.hackathon.model.User;
import com.example.hackathon.repository.AlumniRequestRepository;
import com.example.hackathon.repository.UserRepository;
import com.example.hackathon.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/alumni")
@CrossOrigin
public class AlumniController {

    @Autowired
    private AlumniRequestRepository alumniRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping("/pending-requests/{professorId}")
    public ResponseEntity<List<AlumniRequest>> getPendingRequests(@PathVariable String professorId) {
        List<AlumniRequest> pendingRequests = alumniRequestRepository
            .findByProfessorIdAndStatus(professorId, AlumniRequest.RequestStatus.PENDING);
        return ResponseEntity.ok(pendingRequests);
    }

    @PutMapping("/approve/{requestId}")
    public ResponseEntity<?> approveRequest(@PathVariable String requestId) {
        try {
            Optional<AlumniRequest> requestOpt = alumniRequestRepository.findById(requestId);
            if (!requestOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Request not found!"));
            }

            AlumniRequest request = requestOpt.get();
            request.setStatus(AlumniRequest.RequestStatus.APPROVED);
            alumniRequestRepository.save(request);

            // Update user approval status
            Optional<User> userOpt = userRepository.findById(request.getAlumniId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setApproved(true);
                userRepository.save(user);

                // Send approval email
                Optional<User> professorOpt = userRepository.findById(request.getProfessorId());
                String professorName = professorOpt.isPresent() ? professorOpt.get().getUsername() : "Professor";
                emailService.sendAlumniApprovalNotification(user.getEmail(), professorName, true);
            }

            return ResponseEntity.ok(new ApiResponse(true, "Alumni request approved successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to approve request: " + e.getMessage()));
        }
    }

    @PutMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectRequest(@PathVariable String requestId) {
        try {
            Optional<AlumniRequest> requestOpt = alumniRequestRepository.findById(requestId);
            if (!requestOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Request not found!"));
            }

            AlumniRequest request = requestOpt.get();
            request.setStatus(AlumniRequest.RequestStatus.REJECTED);
            alumniRequestRepository.save(request);

            // Send rejection email
            Optional<User> professorOpt = userRepository.findById(request.getProfessorId());
            String professorName = professorOpt.isPresent() ? professorOpt.get().getUsername() : "Professor";
            emailService.sendAlumniApprovalNotification(request.getAlumniEmail(), professorName, false);

            return ResponseEntity.ok(new ApiResponse(true, "Alumni request rejected successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to reject request: " + e.getMessage()));
        }
    }
}