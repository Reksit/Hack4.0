package com.example.hackathon.dto;

public class SendMessageRequest {
    private String senderId;
    private String receiverId;
    private String message;

    // Constructors
    public SendMessageRequest() {}

    // Getters and Setters
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}