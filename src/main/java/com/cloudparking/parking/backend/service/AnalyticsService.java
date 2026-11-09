package com.cloudparking.parking.backend.service;

import com.cloudparking.parking.backend.dto.LotOccupancyResponse;
import com.cloudparking.parking.backend.dto.LotRevenueResponse;
import com.cloudparking.parking.backend.entity.Booking;
import com.cloudparking.parking.backend.entity.ParkingLot;
import com.cloudparking.parking.backend.enums.BookingStatus;
import com.cloudparking.parking.backend.enums.SpaceStatus;
import com.cloudparking.parking.backend.exception.ResourceNotFoundException;
import com.cloudparking.parking.backend.repository.BookingRepository;
import com.cloudparking.parking.backend.repository.ParkingLotRepository;
import com.cloudparking.parking.backend.repository.ParkingSpaceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalyticsService {

    private final ParkingLotRepository lotRepository;
    private final ParkingSpaceRepository spaceRepository;
    private final BookingRepository bookingRepository;

    public AnalyticsService(ParkingLotRepository lotRepository,
                            ParkingSpaceRepository spaceRepository,
                            BookingRepository bookingRepository) {
        this.lotRepository = lotRepository;
        this.spaceRepository = spaceRepository;
        this.bookingRepository = bookingRepository;
    }

    public LotOccupancyResponse getLotOccupancy(Long lotId) {
        ParkingLot lot = lotRepository.findById(lotId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking lot with ID " + lotId + " not found."));

        long available = spaceRepository.countByParkingLotIdAndStatus(lotId, SpaceStatus.AVAILABLE);
        long reserved = spaceRepository.countByParkingLotIdAndStatus(lotId, SpaceStatus.RESERVED);
        long occupied = spaceRepository.countByParkingLotIdAndStatus(lotId, SpaceStatus.OCCUPIED);
        long maintenance = spaceRepository.countByParkingLotIdAndStatus(lotId, SpaceStatus.MAINTENANCE);

        long configuredSpaces = available + reserved + occupied + maintenance;
        double occupancyRate = configuredSpaces > 0
                ? Math.round(((double) (reserved + occupied) / configuredSpaces) * 100.0 * 100.0) / 100.0
                : 0.0;

        return new LotOccupancyResponse(
                lot.getId(),
                lot.getName(),
                lot.getTotalSpaces(),
                available,
                reserved,
                occupied,
                maintenance,
                occupancyRate
        );
    }

    public LotRevenueResponse getLotRevenue(Long lotId) {
        ParkingLot lot = lotRepository.findById(lotId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking lot with ID " + lotId + " not found."));

        List<BookingStatus> activeStatuses = List.of(BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.COMPLETED);
        List<Booking> bookings = bookingRepository.findBookingsByLotIdAndStatuses(lotId, activeStatuses);

        double totalRevenue = bookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();

        return new LotRevenueResponse(
                lot.getId(),
                lot.getName(),
                bookings.size(),
                Math.round(totalRevenue * 100.0) / 100.0
        );
    }
}
