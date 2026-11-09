package com.cloudparking.parking.backend.controller;

import com.cloudparking.parking.backend.dto.BookingRequest;
import com.cloudparking.parking.backend.entity.Booking;
import com.cloudparking.parking.backend.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody BookingRequest request) {
        Booking booking = bookingService.createBooking(request);
        return new ResponseEntity<>(booking, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        Booking cancelledBooking = bookingService.cancelBooking(id);
        return ResponseEntity.ok(cancelledBooking);
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getBookings(@RequestParam String email) {
        List<Booking> bookings = bookingService.getBookingsByUser(email);
        return ResponseEntity.ok(bookings);
    }
}
