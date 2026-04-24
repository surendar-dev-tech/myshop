package com.myshop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.myshop.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "customers",
        uniqueConstraints = @UniqueConstraint(name = "uk_customer_company_phone", columnNames = {"company_id", "phone"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Customer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Column
    private String phone;
    
    @Email
    private String email;
    
    private String address;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal creditLimit = BigDecimal.ZERO; // Maximum credit allowed
    
    @Column(precision = 10, scale = 2)
    private BigDecimal currentCredit = BigDecimal.ZERO; // Current outstanding balance
    
    private Integer creditDays = 30; // Default credit period in days
    
    @JsonIgnore
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Sale> sales = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CreditTransaction> creditTransactions = new ArrayList<>();
    
    // Calculated field for outstanding balance
    @Transient
    private BigDecimal outstandingBalance;

    /** Filled by API when listing customers — not stored on this entity */
    @Transient
    private Boolean onlineOrderingEnabled;

    /** Login username for online ordering, if enabled */
    @Transient
    private String portalUsername;
}

