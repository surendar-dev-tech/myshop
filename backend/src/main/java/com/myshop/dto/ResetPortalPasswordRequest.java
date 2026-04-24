package com.myshop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPortalPasswordRequest {

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;
}
