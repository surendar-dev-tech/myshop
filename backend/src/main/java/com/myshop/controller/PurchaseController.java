package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.PurchaseRequest;
import com.myshop.entity.Purchase;
import com.myshop.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/purchases")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class PurchaseController {
    
    @Autowired
    private PurchaseService purchaseService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<Purchase>> createPurchase(@Valid @RequestBody PurchaseRequest purchaseRequest) {
        Purchase purchase = purchaseService.createPurchase(purchaseRequest);
        return ResponseEntity.ok(ApiResponse.success("Purchase created successfully", purchase));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Purchase>>> getAllPurchases() {
        List<Purchase> purchases = purchaseService.getAllPurchases();
        return ResponseEntity.ok(ApiResponse.success(purchases));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Purchase>> getPurchaseById(@PathVariable Long id) {
        Purchase purchase = purchaseService.getPurchaseById(id);
        return ResponseEntity.ok(ApiResponse.success(purchase));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<Purchase>>> getPurchasesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<Purchase> purchases = purchaseService.getPurchasesByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(purchases));
    }
    
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<ApiResponse<List<Purchase>>> getPurchasesBySupplier(@PathVariable Long supplierId) {
        List<Purchase> purchases = purchaseService.getPurchasesBySupplier(supplierId);
        return ResponseEntity.ok(ApiResponse.success(purchases));
    }
}

