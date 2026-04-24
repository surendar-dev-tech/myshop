package com.myshop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.myshop.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "sale_items")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class SaleItem extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    @NotNull
    private Sale sale;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @NotNull
    private Product product;
    
    @NotNull
    @Positive
    @Column(nullable = false)
    private BigDecimal quantity;
    
    @NotNull
    @Positive
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;
    
    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(length = 16)
    private String hsnCode;

    @Column(precision = 5, scale = 2)
    private BigDecimal gstRatePercent;
}

