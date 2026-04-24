package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.SaleDto;
import com.myshop.dto.SaleRequest;
import com.myshop.entity.Sale;
import com.myshop.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sales")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class SaleController {
    
    @Autowired
    private SaleService saleService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<SaleDto>> createSale(@Valid @RequestBody SaleRequest saleRequest) {
        Sale sale = saleService.createSale(saleRequest);
        SaleDto saleDto = saleService.convertToDto(sale);
        return ResponseEntity.ok(ApiResponse.success("Sale created successfully", saleDto));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<SaleDto>>> getAllSales() {
        List<Sale> sales = saleService.getAllSales();
        List<SaleDto> saleDtos = sales.stream()
                .map(saleService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(saleDtos));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleDto>> getSaleById(@PathVariable Long id) {
        Sale sale = saleService.getSaleById(id);
        SaleDto saleDto = saleService.convertToDto(sale);
        return ResponseEntity.ok(ApiResponse.success(saleDto));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<SaleDto>>> getSalesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<Sale> sales = saleService.getSalesByDateRange(startDate, endDate);
        List<SaleDto> saleDtos = sales.stream()
                .map(saleService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(saleDtos));
    }
}

