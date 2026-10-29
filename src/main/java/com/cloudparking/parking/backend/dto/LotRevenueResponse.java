package com.cloudparking.parking.backend.dto;

public class LotRevenueResponse {
    private Long lotId;
    private String lotName;
    private long totalConfirmedBookings;
    private double totalRevenue;

    public LotRevenueResponse(Long lotId, String lotName, long totalConfirmedBookings, double totalRevenue) {
        this.lotId = lotId;
        this.lotName = lotName;
        this.totalConfirmedBookings = totalConfirmedBookings;
        this.totalRevenue = totalRevenue;
    }

    public Long getLotId() { return lotId; }
    public String getLotName() { return lotName; }
    public long getTotalConfirmedBookings() { return totalConfirmedBookings; }
    public double getTotalRevenue() { return totalRevenue; }
}
