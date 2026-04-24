package com.myshop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.myshop.entity.Purchase;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequest {
    
    private Long supplierId; // Optional - can purchase without supplier
    
    private LocalDate purchaseDate;
    
    @NotEmpty
    @Valid
    private List<PurchaseItemRequest> items;
    
    private BigDecimal discount = BigDecimal.ZERO;
    
    @NotNull
    private Purchase.PaymentStatus paymentStatus;
    
    private String notes;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseItemRequest {
        @NotNull
        private Long productId;
        
        @NotNull
        private BigDecimal quantity;
        
        @NotNull
        private BigDecimal unitPrice;
        
        private BigDecimal discount = BigDecimal.ZERO;
        
        private String batchNumber;
        
        private LocalDate expiryDate;
    }
}

