package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.CustomerOrderDto;
import com.myshop.dto.PlaceCustomerOrderRequest;
import com.myshop.service.CustomerOrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/portal")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
public class CustomerPortalController {

    @Autowired
    private CustomerOrderService customerOrderService;

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<CustomerOrderDto>> placeOrder(@Valid @RequestBody PlaceCustomerOrderRequest request) {
        CustomerOrderDto created = customerOrderService.placeOrder(request);
        return ResponseEntity.ok(ApiResponse.success("Order placed successfully", created));
    }
}
