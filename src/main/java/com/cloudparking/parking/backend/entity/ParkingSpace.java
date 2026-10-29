package com.cloudparking.parking.backend.entity;

import com.cloudparking.parking.backend.enums.SpaceStatus;
import com.cloudparking.parking.backend.enums.SpaceType;
import jakarta.persistence.*;

@Entity
@Table(name = "parking_spaces")
public class ParkingSpace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String spaceNumber; // e.g., "A-101", "B-205"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpaceType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpaceStatus status;

    // Many spaces belong to One Parking Lot
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    public ParkingSpace() {}

    public ParkingSpace(String spaceNumber, SpaceType type, SpaceStatus status, ParkingLot parkingLot) {
        this.spaceNumber = spaceNumber;
        this.type = type;
        this.status = status;
        this.parkingLot = parkingLot;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSpaceNumber() { return spaceNumber; }
    public void setSpaceNumber(String spaceNumber) { this.spaceNumber = spaceNumber; }

    public SpaceType getType() { return type; }
    public void setType(SpaceType type) { this.type = type; }

    public SpaceStatus getStatus() { return status; }
    public void setStatus(SpaceStatus status) { this.status = status; }

    public ParkingLot getParkingLot() { return parkingLot; }
    public void setParkingLot(ParkingLot parkingLot) { this.parkingLot = parkingLot; }
}
