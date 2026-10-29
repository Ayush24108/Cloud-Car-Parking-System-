package com.cloudparking.parking.backend.controller;

import com.cloudparking.parking.backend.dto.LotOccupancyResponse;
import com.cloudparking.parking.backend.dto.LotRevenueResponse;
import com.cloudparking.parking.backend.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/lots/{lotId}/occupancy")
    public ResponseEntity<LotOccupancyResponse> getOccupancy(@PathVariable Long lotId) {
        return ResponseEntity.ok(analyticsService.getLotOccupancy(lotId));
    }

    @GetMapping("/lots/{lotId}/revenue")
    public ResponseEntity<LotRevenueResponse> getRevenue(@PathVariable Long lotId) {
        return ResponseEntity.ok(analyticsService.getLotRevenue(lotId));
    }
}
