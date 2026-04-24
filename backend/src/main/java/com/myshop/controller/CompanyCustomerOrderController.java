package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.CustomerOrderDto;
import com.myshop.dto.SaleDto;
import com.myshop.service.CustomerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customer-orders")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class CompanyCustomerOrderController {

    @Autowired
    private CustomerOrderService customerOrderService;

    @GetMapping("/unseen-count")
    public ResponseEntity<ApiResponse<Long>> unseenCount() {
        return ResponseEntity.ok(ApiResponse.success(customerOrderService.countUnseen()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerOrderDto>>> list() {
        return ResponseEntity.ok(ApiResponse.success(customerOrderService.listOrdersForCompany()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerOrderDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(customerOrderService.getById(id)));
    }

    @PatchMapping("/{id}/seen")
    public ResponseEntity<ApiResponse<Void>> markSeen(@PathVariable Long id) {
        customerOrderService.markSeen(id);
        return ResponseEntity.ok(ApiResponse.success("Marked as seen", null));
    }

    @PostMapping("/{id}/convert-to-sale")
    public ResponseEntity<ApiResponse<SaleDto>> convertToSale(@PathVariable Long id) {
        SaleDto sale = customerOrderService.convertCustomerOrderToSale(id);
        return ResponseEntity.ok(ApiResponse.success("Sale created from order", sale));
    }
}
