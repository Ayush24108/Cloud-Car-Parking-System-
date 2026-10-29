package com.cloudparking.parking.backend.repository;

import com.cloudparking.parking.backend.entity.Booking;
import com.cloudparking.parking.backend.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserEmail(String userEmail);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.parkingSpace.id = :spaceId
          AND b.status IN ('CONFIRMED', 'ACTIVE')
          AND b.startTime < :requestedEndTime
          AND b.endTime > :requestedStartTime
    """)
    boolean existsOverlappingBookingForSpace(
        @Param("spaceId") Long spaceId,
        @Param("requestedStartTime") LocalDateTime requestedStartTime,
        @Param("requestedEndTime") LocalDateTime requestedEndTime
    );

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.userEmail = :userEmail
          AND b.status IN ('CONFIRMED', 'ACTIVE')
          AND b.startTime < :requestedEndTime
          AND b.endTime > :requestedStartTime
    """)
    boolean existsOverlappingBookingForUser(
        @Param("userEmail") String userEmail,
        @Param("requestedStartTime") LocalDateTime requestedStartTime,
        @Param("requestedEndTime") LocalDateTime requestedEndTime
    );

    @Query("""
        SELECT b FROM Booking b
        WHERE b.parkingSpace.parkingLot.id = :lotId
          AND b.status IN (:statuses)
    """)
    List<Booking> findBookingsByLotIdAndStatuses(
        @Param("lotId") Long lotId,
        @Param("statuses") List<BookingStatus> statuses
    );
}
