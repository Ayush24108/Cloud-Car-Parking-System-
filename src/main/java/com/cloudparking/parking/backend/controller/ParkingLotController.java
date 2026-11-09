package com.cloudparking.parking.backend.controller;

import com.cloudparking.parking.backend.entity.ParkingLot;
import com.cloudparking.parking.backend.repository.ParkingLotRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lots")
public class ParkingLotController {

    private final ParkingLotRepository lotRepository;

    public ParkingLotController(ParkingLotRepository lotRepository) {
        this.lotRepository = lotRepository;
    }

    @GetMapping
    public List<ParkingLot> getAllLots() {
        return lotRepository.findAll();
    }

    @PostMapping
    public ParkingLot createLot(@RequestBody ParkingLot lot) {
        return lotRepository.save(lot);
    }
}