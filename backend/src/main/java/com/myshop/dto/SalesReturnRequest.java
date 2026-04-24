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
public class SalesReturnRequest {

    private Long customerId;

    private Long referenceSaleId;

    private LocalDate returnDate;

    @NotEmpty
    @Valid
    private List<SalesReturnItemRequest> items;

    private BigDecimal discount = BigDecimal.ZERO;

    private String notes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesReturnItemRequest {
        @NotNull
        private Long productId;

        @NotNull
        private BigDecimal quantity;

        @NotNull
        private BigDecimal unitPrice;

        private BigDecimal discount = BigDecimal.ZERO;
    }
}
