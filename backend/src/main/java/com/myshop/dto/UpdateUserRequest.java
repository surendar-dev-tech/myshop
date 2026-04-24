package com.myshop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @NotBlank
    @Size(max = 200)
    private String fullName;

    @Pattern(regexp = "^$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "Invalid email")
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(max = 32)
    private String phone;
}
