package com.myshop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private String role;
    /** Tenant (registered company); each account only sees its own data */
    private Long companyId;
    private String companyName;

    /** Set when {@code role} is CUSTOMER — links to {@link com.myshop.entity.Customer} id */
    private Long customerProfileId;
}









