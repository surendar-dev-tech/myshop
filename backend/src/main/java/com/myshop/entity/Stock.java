package com.myshop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.myshop.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "stock")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Stock extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @NotNull
    private Product product;
    
    @NotNull
    @Column(nullable = false)
    private BigDecimal quantity;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;
    
    private String notes;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Who performed the transaction
    
    public enum TransactionType {
        STOCK_IN, STOCK_OUT, ADJUSTMENT
    }
}

