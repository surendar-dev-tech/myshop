package com.myshop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCustomerPortalRequest {

    @NotBlank
    private String username;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
