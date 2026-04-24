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
@Table(name = "purchase_return_items")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReturnItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_return_id", nullable = false)
    @NotNull
    private PurchaseReturn purchaseReturn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @NotNull
    private Product product;

    @NotNull
    @Positive
    @Column(nullable = false)
    private BigDecimal quantity;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;
}
