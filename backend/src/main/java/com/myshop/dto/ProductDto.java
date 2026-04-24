package com.myshop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductDto {
    private Long id;
    
    @NotBlank
    private String name;
    
    private String description;
    
    @NotBlank
    private String barcode;
    
    private Long categoryId;
    private String categoryName;
    
    @NotNull
    @Positive
    private BigDecimal purchasePrice;
    
    @NotNull
    @Positive
    private BigDecimal sellingPrice;
    
    @NotBlank
    private String unit;

    /** HSN/SAC for GST. */
    private String hsnCode;

    /** GST % (e.g. 5, 12, 18). */
    private BigDecimal gstRatePercent;
    
    private Boolean active = true;
    
    private BigDecimal currentStock;
    private Boolean lowStock;
}









