package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.entity.Category;
import com.myshop.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@CrossOrigin(origins = "*")
public class CategoryController {
    
    @Autowired
    private CategoryService categoryService;
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@Valid @RequestBody Category category) {
        Category created = categoryService.createCategory(category);
        return ResponseEntity.ok(ApiResponse.success("Category created successfully", created));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @PathVariable Long id, 
            @Valid @RequestBody Category category) {
        Category updated = categoryService.updateCategory(id, category);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", updated));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> getCategoryById(@PathVariable Long id) {
        Category category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }
}









