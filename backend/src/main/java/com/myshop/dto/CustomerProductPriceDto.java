package com.myshop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProductPriceDto {
    private Long id;
    private Long customerId;
    private Long productId;
    private String productName;
    private BigDecimal unitPrice;
}
