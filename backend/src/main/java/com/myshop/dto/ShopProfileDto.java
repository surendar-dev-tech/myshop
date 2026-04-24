package com.myshop.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShopProfileDto {
    private Long id;
    
    @NotBlank(message = "Shop name is required")
    private String shopName;
    private String address;
    private String phone;
    private String email;
    private String gstNumber;

    /** 2-letter state code (e.g. TN, KA) for GST invoices. */
    private String gstStateCode;

    private String panNumber;
    private String website;
    private String footerMessage;
    private String termsAndConditions;
    private String invoiceHeader;
    private String invoiceFooter;
    private Boolean showLogo;
    private String logoUrl;
    private String invoiceTemplate;
    private String printMode;
    private String profilePicture; // Base64 encoded image or URL
}

