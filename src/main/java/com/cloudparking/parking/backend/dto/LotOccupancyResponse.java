package com.cloudparking.parking.backend.dto;

public class LotOccupancyResponse {
    private Long lotId;
    private String lotName;
    private int totalLotCapacity;
    private long availableSpaces;
    private long reservedSpaces;
    private long occupiedSpaces;
    private long maintenanceSpaces;
    private double occupancyPercentage;

    public LotOccupancyResponse(Long lotId, String lotName, int totalLotCapacity, long availableSpaces,
                                long reservedSpaces, long occupiedSpaces, long maintenanceSpaces, double occupancyPercentage) {
        this.lotId = lotId;
        this.lotName = lotName;
        this.totalLotCapacity = totalLotCapacity;
        this.availableSpaces = availableSpaces;
        this.reservedSpaces = reservedSpaces;
        this.occupiedSpaces = occupiedSpaces;
        this.maintenanceSpaces = maintenanceSpaces;
        this.occupancyPercentage = occupancyPercentage;
    }

    public Long getLotId() { return lotId; }
    public String getLotName() { return lotName; }
    public int getTotalLotCapacity() { return totalLotCapacity; }
    public long getAvailableSpaces() { return availableSpaces; }
    public long getReservedSpaces() { return reservedSpaces; }
    public long getOccupiedSpaces() { return occupiedSpaces; }
    public long getMaintenanceSpaces() { return maintenanceSpaces; }
    public double getOccupancyPercentage() { return occupancyPercentage; }
}
