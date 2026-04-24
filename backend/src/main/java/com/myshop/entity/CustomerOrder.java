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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "customer_orders",
        uniqueConstraints =
                @UniqueConstraint(name = "uk_customer_order_company_number", columnNames = {"company_id", "order_number"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /** Customer login user who placed the order */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User placedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, length = 64)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sale.PaymentMode paymentMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerOrderStatus status = CustomerOrderStatus.PENDING;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    /** Staff dashboard: cleared when someone opens the order list or marks seen */
    @Column(nullable = false)
    private Boolean seenByCompany = false;

    /** Set when converted to a {@link Sale} */
    @Column(name = "converted_sale_id")
    private Long convertedSaleId;

    @JsonIgnore
    @OneToMany(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomerOrderItem> items = new ArrayList<>();

    public enum CustomerOrderStatus {
        PENDING,
        CONFIRMED,
        CANCELLED
    }
}
