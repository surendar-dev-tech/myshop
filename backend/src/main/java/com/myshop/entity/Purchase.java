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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "purchases",
        uniqueConstraints = @UniqueConstraint(name = "uk_purchase_company_number", columnNames = {"company_id", "purchase_number"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Purchase extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String purchaseNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier; // Optional - can purchase without supplier
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull
    private User user; // Who made the purchase
    
    @NotNull
    @Column(nullable = false)
    private LocalDate purchaseDate;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal finalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItem> items = new ArrayList<>();
    
    public enum PaymentStatus {
        PAID, PARTIAL, PENDING
    }
}

