package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class AnalyticsController {
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardAnalytics() {
        Map<String, Object> analytics = analyticsService.getDashboardAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
    
    @GetMapping("/sales-trend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSalesTrend(
            @RequestParam(defaultValue = "30") int days) {
        Map<String, Object> trend = analyticsService.getSalesTrend(days);
        return ResponseEntity.ok(ApiResponse.success(trend));
    }
    
    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {
        Map<String, Object> products = analyticsService.getTopProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(products));
    }
    
    @GetMapping("/top-customers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTopCustomers(
            @RequestParam(defaultValue = "10") int limit) {
        Map<String, Object> customers = analyticsService.getTopCustomers(limit);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }
    
    @GetMapping("/profit-loss")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfitLossReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        Map<String, Object> report = analyticsService.getProfitLossReport(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
    
    @GetMapping("/profit-loss/enhanced")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEnhancedProfitLossReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        Map<String, Object> report = analyticsService.getEnhancedProfitLossReport(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}

