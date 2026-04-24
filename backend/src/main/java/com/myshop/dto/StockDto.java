package com.myshop.dto;

import com.myshop.entity.Stock;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockDto {
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal quantity;
    private Stock.TransactionType transactionType;
    private BigDecimal unitPrice;
    private String notes;
    private String userName;
    private LocalDateTime createdAt;
}









