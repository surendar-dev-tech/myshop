package com.myshop.entity;

import com.myshop.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String username;
    
    @NotBlank
    @Column(nullable = false)
    private String password;
    
    @NotBlank
    private String fullName;
    
    @Email
    @Column(unique = true)
    private String email;
    
    @NotBlank
    private String phone;
    
    /**
     * Links to {@link Customer} when {@link #role} is {@link Role#CUSTOMER} (online ordering profile).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customerProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STAFF;

    @Column(nullable = false)
    private Boolean active = true;

    public enum Role {
        ADMIN,
        STAFF,
        CUSTOMER
    }
}









