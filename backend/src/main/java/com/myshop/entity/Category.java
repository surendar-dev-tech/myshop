package com.myshop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.myshop.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "categories",
        uniqueConstraints = @UniqueConstraint(name = "uk_category_company_name", columnNames = {"company_id", "name"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @NotBlank
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    @JsonIgnore
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Product> products = new ArrayList<>();
}

