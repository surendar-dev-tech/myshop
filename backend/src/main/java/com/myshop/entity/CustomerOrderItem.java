package com.myshop.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "customer_order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_order_id", nullable = false)
    private CustomerOrder customerOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 255)
    private String productName;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}
