package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class ReportController {
    
    @Autowired
    private ReportService reportService;
    
    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDailySalesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date) {
        Map<String, Object> report = reportService.getDailySalesReport(date);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
    
    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlySalesReport(
            @RequestParam int year,
            @RequestParam int month) {
        Map<String, Object> report = reportService.getMonthlySalesReport(year, month);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSalesReportByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> report = reportService.getSalesReportByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
    
    @GetMapping("/customer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerWiseSalesReport(
            @RequestParam Long customerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        // If dates not provided, use last 30 days
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        Map<String, Object> report = reportService.getCustomerWiseSalesReport(customerId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
    
    @GetMapping("/product")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductWiseSalesReport(
            @RequestParam Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        // If dates not provided, use last 30 days
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        Map<String, Object> report = reportService.getProductWiseSalesReport(productId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
    
    @GetMapping("/products-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllProductsSalesSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        return ResponseEntity.ok(ApiResponse.success(reportService.getAllProductsSalesSummary(startDate, endDate)));
    }
    
    @GetMapping("/customers-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllCustomersSalesSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        return ResponseEntity.ok(ApiResponse.success(reportService.getAllCustomersSalesSummary(startDate, endDate)));
    }
    
    @GetMapping("/supplier-purchases")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupplierWisePurchaseReport(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        return ResponseEntity.ok(ApiResponse.success(reportService.getSupplierWisePurchaseReport(supplierId, startDate, endDate)));
    }
}

