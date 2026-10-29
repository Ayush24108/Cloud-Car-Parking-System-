package com.cloudparking.parking.backend.controller;

import com.cloudparking.parking.backend.dto.SpaceRequest;
import com.cloudparking.parking.backend.entity.ParkingLot;
import com.cloudparking.parking.backend.entity.ParkingSpace;
import com.cloudparking.parking.backend.enums.SpaceStatus;
import com.cloudparking.parking.backend.repository.ParkingLotRepository;
import com.cloudparking.parking.backend.repository.ParkingSpaceRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spaces")
public class ParkingSpaceController {

    private final ParkingSpaceRepository spaceRepository;
    private final ParkingLotRepository lotRepository;

    public ParkingSpaceController(ParkingSpaceRepository spaceRepository, ParkingLotRepository lotRepository) {
        this.spaceRepository = spaceRepository;
        this.lotRepository = lotRepository;
    }

    // GET /api/spaces/lot/1 -> Returns all available spaces for Lot ID 1
    @GetMapping("/lot/{lotId}")
    public List<ParkingSpace> getSpacesByLot(@PathVariable Long lotId) {
        return spaceRepository.findByParkingLotIdAndStatus(lotId, SpaceStatus.AVAILABLE);
    }

    // POST /api/spaces -> Adds a new space using JSON body
    @PostMapping
    public ParkingSpace addSpace(@RequestBody SpaceRequest request) {
        ParkingLot lot = lotRepository.findById(request.getLotId())
                .orElseThrow(() -> new IllegalArgumentException("Parking lot not found with ID: " + request.getLotId()));

        ParkingSpace space = new ParkingSpace(request.getSpaceNumber(), request.getType(), SpaceStatus.AVAILABLE, lot);
        return spaceRepository.save(space);
    }
}
