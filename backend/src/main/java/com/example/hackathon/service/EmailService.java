package com.example.hackathon.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    public void sendOTP(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@smarteval.com");
        message.setTo(to);
        message.setSubject("SmartEval - Email Verification");
        message.setText("Your verification code is: " + otp + "\n\nThis code will expire in 10 minutes.");
        
        emailSender.send(message);
    }

    public void sendAlumniApprovalNotification(String to, String professorName, boolean approved) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@smarteval.com");
        message.setTo(to);
        message.setSubject("SmartEval - Alumni Request Status");
        
        String status = approved ? "approved" : "rejected";
        message.setText("Your alumni registration request has been " + status + " by Professor " + professorName + ".");
        
        emailSender.send(message);
    }
}