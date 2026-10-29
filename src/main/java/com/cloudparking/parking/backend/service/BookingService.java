package com.cloudparking.parking.backend.service;

import com.cloudparking.parking.backend.dto.BookingRequest;
import com.cloudparking.parking.backend.entity.Booking;
import com.cloudparking.parking.backend.entity.ParkingSpace;
import com.cloudparking.parking.backend.enums.BookingStatus;
import com.cloudparking.parking.backend.enums.SpaceStatus;
import com.cloudparking.parking.backend.exception.ResourceNotFoundException;
import com.cloudparking.parking.backend.repository.BookingRepository;
import com.cloudparking.parking.backend.repository.ParkingSpaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ParkingSpaceRepository spaceRepository;

    public BookingService(BookingRepository bookingRepository, ParkingSpaceRepository spaceRepository) {
        this.bookingRepository = bookingRepository;
        this.spaceRepository = spaceRepository;
    }

    @Transactional
    public Booking createBooking(BookingRequest request) {
        if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().isEqual(request.getStartTime())) {
            throw new IllegalArgumentException("Booking end time must be strictly after start time.");
        }

        if (request.getStartTime().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new IllegalArgumentException("Booking start time cannot be in the past.");
        }

        ParkingSpace space = spaceRepository.findById(request.getSpaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking space with ID " + request.getSpaceId() + " not found."));

        if (space.getStatus() == SpaceStatus.MAINTENANCE) {
            throw new IllegalStateException("Parking space is currently under maintenance.");
        }

        boolean spaceOverlaps = bookingRepository.existsOverlappingBookingForSpace(
                request.getSpaceId(), request.getStartTime(), request.getEndTime());
        if (spaceOverlaps) {
            throw new IllegalArgumentException("Parking space is already booked during the requested time slot.");
        }

        boolean userOverlaps = bookingRepository.existsOverlappingBookingForUser(
                request.getUserEmail(), request.getStartTime(), request.getEndTime());
        if (userOverlaps) {
            throw new IllegalArgumentException("User " + request.getUserEmail() + " already has an active reservation during this time window.");
        }

        // Fee Calculation: (Duration in minutes / 60.0) * hourlyRate
        long minutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        double hours = Math.max(1.0, minutes / 60.0);
        double totalFee = hours * space.getParkingLot().getHourlyRate().doubleValue();

        Booking booking = new Booking();
        booking.setParkingSpace(space);
        booking.setUserEmail(request.getUserEmail());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setBookingReference("BK-" + System.currentTimeMillis());
        booking.setTotalAmount(totalFee);

        space.setStatus(SpaceStatus.RESERVED);
        spaceRepository.save(space);

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking with ID " + bookingId + " not found."));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled.");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot cancel a completed booking.");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        // Reset space status back to AVAILABLE
        ParkingSpace space = booking.getParkingSpace();
        space.setStatus(SpaceStatus.AVAILABLE);
        spaceRepository.save(space);

        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsByUser(String userEmail) {
        return bookingRepository.findByUserEmail(userEmail);
    }
}