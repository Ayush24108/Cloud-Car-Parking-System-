package com.cloudparking.parking.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "parking_lots")
public class ParkingLot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private int totalSpaces;

    @Column(nullable = false)
    private BigDecimal hourlyRate;

    public ParkingLot() {}

    public ParkingLot(String name, String address, int totalSpaces, BigDecimal hourlyRate) {
        this.name = name;
        this.address = address;
        this.totalSpaces = totalSpaces;
        this.hourlyRate = hourlyRate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public int getTotalSpaces() { return totalSpaces; }
    public void setTotalSpaces(int totalSpaces) { this.totalSpaces = totalSpaces; }

    public BigDecimal getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(BigDecimal hourlyRate) { this.hourlyRate = hourlyRate; }
}