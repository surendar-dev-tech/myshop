package com.myshop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingCreditDto {
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private BigDecimal outstandingBalance;
}









