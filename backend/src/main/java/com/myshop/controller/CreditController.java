package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.OutstandingCreditDto;
import com.myshop.entity.CreditTransaction;
import com.myshop.service.CreditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/credits")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class CreditController {
    
    @Autowired
    private CreditService creditService;
    
    @PostMapping("/{customerId}/pay")
    public ResponseEntity<ApiResponse<CreditTransaction>> recordCreditPayment(
            @PathVariable Long customerId,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String notes) {
        CreditTransaction transaction = creditService.recordCreditPayment(customerId, amount, notes);
        return ResponseEntity.ok(ApiResponse.success("Payment recorded successfully", transaction));
    }
    
    @GetMapping("/{customerId}/history")
    public ResponseEntity<ApiResponse<List<CreditTransaction>>> getCustomerCreditHistory(@PathVariable Long customerId) {
        List<CreditTransaction> history = creditService.getCustomerCreditHistory(customerId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
    
    @GetMapping("/{customerId}/balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getOutstandingBalance(@PathVariable Long customerId) {
        BigDecimal balance = creditService.getOutstandingBalance(customerId);
        return ResponseEntity.ok(ApiResponse.success(balance));
    }
    
    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<List<OutstandingCreditDto>>> getAllOutstandingBalances() {
        List<OutstandingCreditDto> credits = creditService.getAllOutstandingCreditsWithDetails();
        return ResponseEntity.ok(ApiResponse.success(credits));
    }
    
    @GetMapping("/aging")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCreditAgingReport() {
        Map<String, Object> report = creditService.getCreditAgingReport();
        return ResponseEntity.ok(ApiResponse.success(report));
    }
    
    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<CreditTransaction>>> getAllOverdueCredits() {
        List<CreditTransaction> overdue = creditService.getAllOverdueCredits();
        return ResponseEntity.ok(ApiResponse.success(overdue));
    }
    
    @GetMapping("/{customerId}/overdue")
    public ResponseEntity<ApiResponse<List<CreditTransaction>>> getCustomerOverdueCredits(@PathVariable Long customerId) {
        List<CreditTransaction> overdue = creditService.getOverdueCredits(customerId);
        return ResponseEntity.ok(ApiResponse.success(overdue));
    }
}

