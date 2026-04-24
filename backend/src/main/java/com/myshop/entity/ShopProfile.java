package com.myshop.entity;

import com.myshop.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "shop_profile")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ShopProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false, unique = true)
    private Company company;

    @Column(nullable = false)
    private String shopName;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    private String phone;
    
    private String email;
    
    private String gstNumber;

    /** 2-letter state code for India GST (e.g. TN, KA) — used for intra-state CGST/SGST split on invoices. */
    @Column(length = 4)
    private String gstStateCode;
    
    private String panNumber;
    
    private String website;
    
    @Column(columnDefinition = "TEXT")
    private String footerMessage;
    
    @Column(columnDefinition = "TEXT")
    private String termsAndConditions;
    
    // Invoice customization settings
    @Column(columnDefinition = "TEXT")
    private String invoiceHeader; // Custom header HTML/text
    
    @Column(columnDefinition = "TEXT")
    private String invoiceFooter; // Custom footer HTML/text
    
    private Boolean showLogo = false;
    
    private String logoUrl;
    
    private String invoiceTemplate = "DEFAULT"; // DEFAULT, MODERN, MINIMAL, etc.
    
    private String printMode = "POS"; // POS (80mm), A5, A4
    
    @Column(columnDefinition = "TEXT")
    private String profilePicture; // Base64 encoded image or URL
    
}

