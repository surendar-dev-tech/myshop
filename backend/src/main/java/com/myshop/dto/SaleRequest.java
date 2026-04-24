package com.myshop.dto;

import com.myshop.entity.Sale;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class SaleRequest {
    private Long customerId;
    
    @NotEmpty
    @Valid
    private List<SaleItemRequest> items;
    
    @NotNull
    private BigDecimal discount = BigDecimal.ZERO;
    
    @NotNull
    private Sale.PaymentMode paymentMode;
    
    @NotNull
    private Boolean isCredit = false;
    
    private BigDecimal partialPaymentAmount = BigDecimal.ZERO; // Amount paid during credit sale

    /** When completing sale from POS after opening an online order — links the sale to that order */
    private Long sourceCustomerOrderId;

    @Data
    public static class SaleItemRequest {
        @NotNull
        private Long productId;
        
        @NotNull
        private BigDecimal quantity;
        
        private BigDecimal discount = BigDecimal.ZERO;

        /**
         * Selling price per unit for this line. If null or not positive, the product
         * catalog sellingPrice is used (POS default).
         */
        private BigDecimal unitPrice;
    }
}

