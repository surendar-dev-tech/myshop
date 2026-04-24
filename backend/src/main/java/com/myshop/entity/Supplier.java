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

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "suppliers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Supplier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @NotBlank
    @Column(nullable = false)
    private String name;
    
    private String companyName;
    
    @NotBlank
    @Column(nullable = false)
    private String phone;
    
    @Email
    private String email;
    
    private String address;
    
    private String city;
    
    private String state;
    
    private String pincode;
    
    private String gstNumber;
    
    private String panNumber;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @JsonIgnore
    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Purchase> purchases = new ArrayList<>();
}









