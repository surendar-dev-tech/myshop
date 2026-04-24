package com.myshop.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpsertCustomerProductPriceRequest {

    @NotNull
    private Long customerId;

    @NotNull
    private Long productId;

    @NotNull
    @Positive
    private BigDecimal unitPrice;
}
