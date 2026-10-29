package com.cloudparking.parking.backend.config;

import com.cloudparking.parking.backend.entity.ParkingLot;
import com.cloudparking.parking.backend.entity.ParkingSpace;
import com.cloudparking.parking.backend.enums.SpaceStatus;
import com.cloudparking.parking.backend.enums.SpaceType;
import com.cloudparking.parking.backend.repository.ParkingLotRepository;
import com.cloudparking.parking.backend.repository.ParkingSpaceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ParkingLotRepository lotRepository;
    private final ParkingSpaceRepository spaceRepository;

    public DataInitializer(ParkingLotRepository lotRepository, ParkingSpaceRepository spaceRepository) {
        this.lotRepository = lotRepository;
        this.spaceRepository = spaceRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Only seed when the database is empty
        if (lotRepository.count() == 0) {
            System.out.println("=== Seeding Campus Parking Data into MySQL ===");

            // ------------------------------------------------=================
            // 1. MAIN GATE PARKING (70 Slots @ Rate 50/hr)
            // ------------------------------------------------=================
            ParkingLot mainGate = saveLot(
                "Main Gate Parking",
                "Main Gate Entrance",
                70,
                "50.00"
            );
            generateSpacesForLot(mainGate, "MG", 70);

            // ------------------------------------------------=================
            // 2. RESEARCH AND DEVELOPMENT GATE PARKING (30 Slots @ Rate 50/hr)
            // ------------------------------------------------=================
            ParkingLot rdGate = saveLot(
                "Research and Development Gate Parking",
                "R&D Gate Entrance",
                30,
                "50.00"
            );
            generateSpacesForLot(rdGate, "RD", 30);

            System.out.println("=== Campus Parking Data Successfully Seeded into MySQL! ===");
        }
    }

    private ParkingLot saveLot(String name, String address, int totalSpaces, String hourlyRate) {
        ParkingLot lot = new ParkingLot();
        lot.setName(name);
        lot.setAddress(address);
        lot.setTotalSpaces(totalSpaces);
        lot.setHourlyRate(new BigDecimal(hourlyRate));
        return lotRepository.save(lot);
    }

    private void generateSpacesForLot(ParkingLot lot, String prefix, int totalSlots) {
        for (int i = 1; i <= totalSlots; i++) {
            ParkingSpace space = new ParkingSpace();
            space.setParkingLot(lot);
            space.setSpaceNumber(prefix + "-" + String.format("%02d", i)); // e.g., MG-01 ... MG-70

            // Assign standard breakdown of space types
            if (i % 10 == 0) {
                space.setType(SpaceType.EV_CHARGING);
            } else if (i % 8 == 0) {
                space.setType(SpaceType.HANDICAP);
            } else if (i % 5 == 0) {
                space.setType(SpaceType.COMPACT);
            } else {
                space.setType(SpaceType.STANDARD);
            }

            space.setStatus(SpaceStatus.AVAILABLE);
            spaceRepository.save(space);
        }
    }
}