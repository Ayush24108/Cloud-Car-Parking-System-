package com.cloudparking.parking.backend.service;

import com.cloudparking.parking.backend.dto.AuthRequest;
import com.cloudparking.parking.backend.dto.AuthResponse;
import com.cloudparking.parking.backend.dto.RegisterRequest;
import com.cloudparking.parking.backend.entity.User;
import com.cloudparking.parking.backend.enums.Role;
import com.cloudparking.parking.backend.exception.ResourceNotFoundException;
import com.cloudparking.parking.backend.repository.UserRepository;
import com.cloudparking.parking.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        // Enforce @thapar.edu email domain check
        if (!email.endsWith("@thapar.edu")) {
            throw new IllegalArgumentException("Registration restricted! Only official @thapar.edu email addresses are permitted.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email " + email + " is already registered.");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_USER;

        User user = new User(
                request.getName(),
                email,
                passwordEncoder.encode(request.getPassword()),
                role
        );

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getRole());
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        // Enforce @thapar.edu email domain check
        if (!email.endsWith("@thapar.edu")) {
            throw new IllegalArgumentException("Access restricted! Only @thapar.edu email accounts are supported.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password. User does not exist."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getRole());
    }
}