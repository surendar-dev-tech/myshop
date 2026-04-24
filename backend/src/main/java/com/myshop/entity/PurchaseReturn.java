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
        name = "purchase_returns",
        uniqueConstraints =
                @UniqueConstraint(name = "uk_purchase_return_company_number", columnNames = {"company_id", "return_number"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReturn extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String returnNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    /** Optional link to original purchase bill. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reference_purchase_id")
    private Purchase referencePurchase;

    @NotNull
    @Column(nullable = false)
    private LocalDate returnDate;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull
    private User user;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "purchaseReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseReturnItem> items = new ArrayList<>();
}
