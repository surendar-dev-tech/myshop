package com.myshop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.myshop.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "products",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_product_company_barcode", columnNames = {"company_id", "barcode"}),
                @UniqueConstraint(name = "uk_product_company_name", columnNames = {"company_id", "name"})
        })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String description;

    @NotBlank
    @Column(nullable = false)
    private String barcode;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    
    @NotNull
    @Positive
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal purchasePrice;
    
    @NotNull
    @Positive
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice;
    
    @NotNull
    @Column(nullable = false)
    private String unit; // e.g., "kg", "piece", "liter", "pack"

    /** HSN/SAC code for GST (India). */
    @Column(length = 16)
    private String hsnCode;

    /**
     * GST rate % (e.g. 5, 12, 18). Applied to tax-inclusive line totals for invoice breakdown.
     * Zero or null means no GST lines for this product.
     */
    @Column(precision = 5, scale = 2)
    private BigDecimal gstRatePercent;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Stock> stockHistory = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> saleItems = new ArrayList<>();
}

