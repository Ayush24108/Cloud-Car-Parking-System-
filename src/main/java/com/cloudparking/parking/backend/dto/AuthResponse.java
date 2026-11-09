package com.cloudparking.parking.backend.dto;

import com.cloudparking.parking.backend.enums.Role;

public class AuthResponse {
    private String token;
    private String email;
    private String name;
    private Role role;

    public AuthResponse(String token, String email, String name, Role role) {
        this.token = token;
        this.email = email;
        this.name = name;
        this.role = role;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public Role getRole() { return role; }
}
