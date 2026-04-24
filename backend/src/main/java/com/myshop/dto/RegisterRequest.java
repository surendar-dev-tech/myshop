package com.myshop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    /** New company / shop name — creates an isolated tenant; you become its admin */
    @NotBlank
    @Size(max = 255)
    private String companyName;

    @NotBlank
    @Size(min = 3, max = 64)
    private String username;

    @NotBlank
    @Size(min = 6, max = 128)
    private String password;

    @NotBlank
    @Size(max = 200)
    private String fullName;

    /** Optional; empty string allowed */
    @Pattern(regexp = "^$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "Invalid email")
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(max = 32)
    private String phone;
}
