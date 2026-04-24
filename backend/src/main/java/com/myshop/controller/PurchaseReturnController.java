package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.PurchaseReturnRequest;
import com.myshop.entity.PurchaseReturn;
import com.myshop.service.PurchaseReturnService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/purchase-returns")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class PurchaseReturnController {

    @Autowired
    private PurchaseReturnService purchaseReturnService;

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseReturn>> create(@Valid @RequestBody PurchaseReturnRequest request) {
        PurchaseReturn created = purchaseReturnService.createPurchaseReturn(request);
        return ResponseEntity.ok(ApiResponse.success("Purchase return recorded", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseReturn>>> list() {
        return ResponseEntity.ok(ApiResponse.success(purchaseReturnService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseReturn>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseReturnService.getById(id)));
    }
}
