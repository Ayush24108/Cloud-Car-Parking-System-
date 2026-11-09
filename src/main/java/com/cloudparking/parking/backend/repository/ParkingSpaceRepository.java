package com.cloudparking.parking.backend.repository;

import com.cloudparking.parking.backend.entity.ParkingSpace;
import com.cloudparking.parking.backend.enums.SpaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSpaceRepository extends JpaRepository<ParkingSpace, Long> {

    List<ParkingSpace> findByParkingLotIdAndStatus(Long lotId, SpaceStatus status);

    List<ParkingSpace> findByParkingLotId(Long lotId);

    long countByParkingLotIdAndStatus(Long lotId, SpaceStatus status);
}