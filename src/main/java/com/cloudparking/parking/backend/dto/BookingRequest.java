package com.cloudparking.parking.backend.dto;

import java.time.LocalDateTime;

public class BookingRequest {

    private Long spaceId;
    private String userEmail;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public BookingRequest() {}

    public Long getSpaceId() { return spaceId; }
    public void setSpaceId(Long spaceId) { this.spaceId = spaceId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
}
