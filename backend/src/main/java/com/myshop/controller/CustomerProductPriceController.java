package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.CustomerProductPriceDto;
import com.myshop.dto.UpsertCustomerProductPriceRequest;
import com.myshop.service.CustomerProductPriceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customer-product-prices")
@CrossOrigin(origins = "*")
public class CustomerProductPriceController {

    @Autowired
    private CustomerProductPriceService customerProductPriceService;

    @GetMapping("/by-customer/{customerId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
    public ResponseEntity<ApiResponse<List<CustomerProductPriceDto>>> listByCustomer(
            @PathVariable Long customerId) {
        List<CustomerProductPriceDto> list = customerProductPriceService.listByCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerProductPriceDto>> upsert(
            @Valid @RequestBody UpsertCustomerProductPriceRequest request) {
        CustomerProductPriceDto dto = customerProductPriceService.upsert(request);
        return ResponseEntity.ok(ApiResponse.success("Saved customer price", dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        customerProductPriceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Removed customer price", null));
    }

    @DeleteMapping("/by-customer/{customerId}/product/{productId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteByCustomerAndProduct(
            @PathVariable Long customerId, @PathVariable Long productId) {
        customerProductPriceService.deleteByCustomerAndProduct(customerId, productId);
        return ResponseEntity.ok(ApiResponse.success("Removed customer price", null));
    }
}
