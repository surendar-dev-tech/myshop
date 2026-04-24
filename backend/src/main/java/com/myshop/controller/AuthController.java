package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.JwtResponse;
import com.myshop.dto.LoginRequest;
import com.myshop.dto.RegisterRequest;
import com.myshop.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<JwtResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        JwtResponse response = authService.register(registerRequest);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

}









