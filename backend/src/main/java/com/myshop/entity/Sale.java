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
        name = "sales",
        uniqueConstraints = @UniqueConstraint(name = "uk_sale_company_invoice", columnNames = {"company_id", "invoice_number"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Sale extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String invoiceNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull
    private User user; // Sales person
    
    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;
    
    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal finalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMode paymentMode;
    
    @Column(nullable = false)
    private Boolean isCredit = false;
    
    @JsonIgnore
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> items = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments = new ArrayList<>();
    
    public enum PaymentMode {
        CASH, UPI, CARD, CREDIT
    }
}

