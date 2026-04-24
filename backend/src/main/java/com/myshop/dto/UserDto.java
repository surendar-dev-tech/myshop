package com.myshop.dto;

import com.myshop.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private Boolean active;
    private LocalDateTime createdAt;

    public static UserDto fromEntity(User u) {
        return new UserDto(
                u.getId(),
                u.getUsername(),
                u.getFullName(),
                u.getEmail(),
                u.getPhone(),
                u.getRole() != null ? u.getRole().name() : null,
                u.getActive(),
                u.getCreatedAt()
        );
    }
}
