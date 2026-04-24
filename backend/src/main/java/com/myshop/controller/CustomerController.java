package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.CreateCustomerPortalRequest;
import com.myshop.dto.ResetPortalPasswordRequest;
import com.myshop.entity.Customer;
import com.myshop.service.CustomerPortalService;
import com.myshop.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/customers")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class CustomerController {
    
    @Autowired
    private CustomerService customerService;

    @Autowired
    private CustomerPortalService customerPortalService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<Customer>> createCustomer(@Valid @RequestBody Customer customer) {
        Customer created = customerService.createCustomer(customer);
        return ResponseEntity.ok(ApiResponse.success("Customer created successfully", created));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> updateCustomer(
            @PathVariable Long id, 
            @Valid @RequestBody Customer customer) {
        Customer updated = customerService.updateCustomer(id, customer);
        return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", updated));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getCustomerById(@PathVariable Long id) {
        Customer customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Customer>>> getAllCustomers() {
        List<Customer> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(ApiResponse.success(customers));
    }
    
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Customer>>> getActiveCustomers() {
        List<Customer> customers = customerService.getActiveCustomers();
        return ResponseEntity.ok(ApiResponse.success(customers));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success("Customer deleted successfully", null));
    }
    
    @GetMapping("/{id}/balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getCustomerBalance(@PathVariable Long id) {
        BigDecimal balance = customerService.getCustomerBalance(id);
        return ResponseEntity.ok(ApiResponse.success(balance));
    }

    /** Staff creates login credentials so the customer can order only from this shop (JWT tenant). */
    @PostMapping("/{id}/portal-account")
    public ResponseEntity<ApiResponse<Void>> createPortalAccount(
            @PathVariable Long id, @Valid @RequestBody CreateCustomerPortalRequest request) {
        customerPortalService.createPortalAccount(id, request);
        return ResponseEntity.ok(ApiResponse.success("Online ordering access created. Share the username and password with the customer.", null));
    }

    @DeleteMapping("/{id}/portal-account")
    public ResponseEntity<ApiResponse<Void>> revokePortalAccount(@PathVariable Long id) {
        customerPortalService.revokePortalAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Online ordering access removed", null));
    }

    @PatchMapping("/{id}/portal-account/password")
    public ResponseEntity<ApiResponse<Void>> resetPortalPassword(
            @PathVariable Long id, @Valid @RequestBody ResetPortalPasswordRequest request) {
        customerPortalService.resetPortalPassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("Password updated", null));
    }
}

