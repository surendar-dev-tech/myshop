package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.entity.Supplier;
import com.myshop.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/suppliers")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class SupplierController {
    
    @Autowired
    private SupplierService supplierService;
    
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Supplier>> createSupplier(@Valid @RequestBody Supplier supplier) {
        Supplier created = supplierService.createSupplier(supplier);
        return ResponseEntity.ok(ApiResponse.success("Supplier created successfully", created));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Supplier>> updateSupplier(
            @PathVariable Long id, 
            @Valid @RequestBody Supplier supplier) {
        Supplier updated = supplierService.updateSupplier(id, supplier);
        return ResponseEntity.ok(ApiResponse.success("Supplier updated successfully", updated));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Supplier>> getSupplierById(@PathVariable Long id) {
        Supplier supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(ApiResponse.success(supplier));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Supplier>>> getAllSuppliers() {
        List<Supplier> suppliers = supplierService.getAllSuppliers();
        return ResponseEntity.ok(ApiResponse.success(suppliers));
    }
    
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Supplier>>> getActiveSuppliers() {
        List<Supplier> suppliers = supplierService.getActiveSuppliers();
        return ResponseEntity.ok(ApiResponse.success(suppliers));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.success("Supplier deleted successfully", null));
    }
}









