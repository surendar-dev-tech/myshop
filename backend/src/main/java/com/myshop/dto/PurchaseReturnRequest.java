package com.myshop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReturnRequest {

    private Long supplierId;

    /** Optional link to original purchase bill. */
    private Long referencePurchaseId;

    private LocalDate returnDate;

    @NotEmpty
    @Valid
    private List<PurchaseReturnItemRequest> items;

    private BigDecimal discount = BigDecimal.ZERO;

    private String notes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseReturnItemRequest {
        @NotNull
        private Long productId;

        @NotNull
        private BigDecimal quantity;

        @NotNull
        private BigDecimal unitPrice;

        private BigDecimal discount = BigDecimal.ZERO;
    }
}
