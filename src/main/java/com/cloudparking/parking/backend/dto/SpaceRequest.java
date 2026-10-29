package com.cloudparking.parking.backend.dto;

import com.cloudparking.parking.backend.enums.SpaceType;

public class SpaceRequest {

    private Long lotId;
    private String spaceNumber;
    private SpaceType type;

    public SpaceRequest() {}

    public Long getLotId() { return lotId; }
    public void setLotId(Long lotId) { this.lotId = lotId; }

    public String getSpaceNumber() { return spaceNumber; }
    public void setSpaceNumber(String spaceNumber) { this.spaceNumber = spaceNumber; }

    public SpaceType getType() { return type; }
    public void setType(SpaceType type) { this.type = type; }
}
