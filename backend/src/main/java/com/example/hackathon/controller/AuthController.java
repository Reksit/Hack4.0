package com.example.hackathon.controller;

import com.example.hackathon.dto.*;
import com.example.hackathon.model.AlumniRequest;
import com.example.hackathon.model.User;
import com.example.hackathon.repository.AlumniRequestRepository;
import com.example.hackathon.repository.UserRepository;
import com.example.hackathon.security.JwtTokenUtil;
import com.example.hackathon.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AlumniRequestRepository alumniRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Check if user already exists
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Email is already taken!"));
            }
            
            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Username is already taken!"));
            }

            // Create user
            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(User.Role.valueOf(request.getRole()));
            
            // Generate OTP
            String otp = generateOTP();
            user.setOtpCode(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            
            User savedUser = userRepository.save(user);
            
            // Send OTP email
            emailService.sendOTP(user.getEmail(), otp);
            
            // Handle alumni special case
            if (request.getRole().equals("ALUMNI") && request.getProfessorEmail() != null) {
                Optional<User> professor = userRepository.findByEmail(request.getProfessorEmail());
                if (professor.isPresent()) {
                    AlumniRequest alumniRequest = new AlumniRequest(
                        savedUser.getId(),
                        savedUser.getUsername(),
                        savedUser.getEmail(),
                        professor.get().getId(),
                        professor.get().getEmail()
                    );
                    alumniRequestRepository.save(alumniRequest);
                }
            }
            
            return ResponseEntity.ok(new ApiResponse(true, "User registered successfully. Please check your email for OTP."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(@RequestBody OtpVerificationRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "User not found!"));
            }
            
            User user = userOpt.get();
            
            if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtp())) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid OTP!"));
            }
            
            if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "OTP has expired!"));
            }
            
            user.setVerified(true);
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            
            // Auto-approve students and professors
            if (user.getRole() != User.Role.ALUMNI) {
                user.setApproved(true);
            }
            
            userRepository.save(user);
            
            return ResponseEntity.ok(new ApiResponse(true, "Email verified successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "OTP verification failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticate(request.getEmail(), request.getPassword());
            
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
            String token = jwtTokenUtil.generateToken(userDetails);
            
            User user = userRepository.findByEmail(request.getEmail()).get();
            
            if (!user.isVerified()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Please verify your email first!"));
            }
            
            if (user.getRole() == User.Role.ALUMNI && !user.isApproved()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Your alumni request is pending professor approval!"));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", new UserResponse(user));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOTP(@RequestBody ResendOtpRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "User not found!"));
            }
            
            User user = userOpt.get();
            String otp = generateOTP();
            user.setOtpCode(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            
            userRepository.save(user);
            emailService.sendOTP(user.getEmail(), otp);
            
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to resend OTP: " + e.getMessage()));
        }
    }

    private void authenticate(String email, String password) throws Exception {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        } catch (DisabledException e) {
            throw new Exception("USER_DISABLED", e);
        } catch (BadCredentialsException e) {
            throw new Exception("INVALID_CREDENTIALS", e);
        }
    }

    private String generateOTP() {
        Random random = new Random();
        return String.format("%04d", random.nextInt(10000));
    }
}