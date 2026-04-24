package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.SalesReturnRequest;
import com.myshop.entity.SalesReturn;
import com.myshop.service.SalesReturnService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sales-returns")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class SalesReturnController {

    @Autowired
    private SalesReturnService salesReturnService;

    @PostMapping
    public ResponseEntity<ApiResponse<SalesReturn>> create(@Valid @RequestBody SalesReturnRequest request) {
        SalesReturn created = salesReturnService.createSalesReturn(request);
        return ResponseEntity.ok(ApiResponse.success("Sales return recorded", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SalesReturn>>> list() {
        return ResponseEntity.ok(ApiResponse.success(salesReturnService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SalesReturn>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salesReturnService.getById(id)));
    }
}
