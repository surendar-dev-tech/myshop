package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.CreateUserRequest;
import com.myshop.dto.ResetPasswordRequest;
import com.myshop.dto.SetUserActiveRequest;
import com.myshop.dto.UpdateUserRequest;
import com.myshop.dto.UserDto;
import com.myshop.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserManagementService userManagementService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> listUsers() {
        List<UserDto> users = userManagementService.listAll();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDto created = userManagementService.create(request);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserDto updated = userManagementService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updated));
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> setActive(
            @PathVariable Long id,
            @Valid @RequestBody SetUserActiveRequest body) {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        userManagementService.setActive(id, body.isActive(), principal);
        return ResponseEntity.ok(ApiResponse.success("Status updated", null));
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request) {
        userManagementService.resetPassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("Password updated", null));
    }
}
