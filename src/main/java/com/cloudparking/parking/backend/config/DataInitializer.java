package com.cloudparking.parking.backend.config;

import com.cloudparking.parking.backend.entity.ParkingLot;
import com.cloudparking.parking.backend.entity.ParkingSpace;
import com.cloudparking.parking.backend.entity.User;
import com.cloudparking.parking.backend.enums.Role;
import com.cloudparking.parking.backend.enums.SpaceStatus;
import com.cloudparking.parking.backend.enums.SpaceType;
import com.cloudparking.parking.backend.repository.ParkingLotRepository;
import com.cloudparking.parking.backend.repository.ParkingSpaceRepository;
import com.cloudparking.parking.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ParkingLotRepository lotRepository;
    private final ParkingSpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(ParkingLotRepository lotRepository,
                           ParkingSpaceRepository spaceRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.lotRepository = lotRepository;
        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Initial Admin & User Accounts (@thapar.edu domain) if missing
        if (userRepository.count() == 0) {
            System.out.println("=== Seeding Initial Admin & User Accounts (@thapar.edu) ===");

            User admin = new User("Campus Admin", "admin@thapar.edu", passwordEncoder.encode("admin123"), Role.ROLE_ADMIN);
            userRepository.save(admin);

            User user = new User("Alex Student", "alex@thapar.edu", passwordEncoder.encode("user123"), Role.ROLE_USER);
            userRepository.save(user);

            System.out.println("Default Accounts Created:");
            System.out.println(" - ADMIN: admin@thapar.edu / admin123");
            System.out.println(" - USER:  alex@thapar.edu / user123");
        }

        // 2. Seed Campus Parking Data if missing
        if (lotRepository.count() == 0) {
            System.out.println("=== Seeding Campus Parking Data into MySQL ===");

            ParkingLot mainGate = saveLot("Main Gate Parking", "Main Gate Entrance", 70, "50.00");
            generateSpacesForLot(mainGate, "MG", 70);

            ParkingLot rdGate = saveLot("Research and Development Gate Parking", "R&D Gate Entrance", 30, "50.00");
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
            space.setSpaceNumber(prefix + "-" + String.format("%02d", i));

            if (i % 10 == 0) space.setType(SpaceType.EV_CHARGING);
            else if (i % 8 == 0) space.setType(SpaceType.HANDICAP);
            else if (i % 5 == 0) space.setType(SpaceType.COMPACT);
            else space.setType(SpaceType.STANDARD);

            space.setStatus(SpaceStatus.AVAILABLE);
            spaceRepository.save(space);
        }
    }
}