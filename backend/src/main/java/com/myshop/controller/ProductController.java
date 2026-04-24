package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.ProductDto;
import com.myshop.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*")
public class ProductController {
    
    @Autowired
    private ProductService productService;
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(@Valid @RequestBody ProductDto productDto) {
        ProductDto created = productService.createProduct(productDto);
        return ResponseEntity.ok(ApiResponse.success("Product created successfully", created));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Long id, 
            @Valid @RequestBody ProductDto productDto) {
        ProductDto updated = productService.updateProduct(id, productDto);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", updated));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable Long id) {
        ProductDto product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> getAllProducts() {
        List<ProductDto> products = productService.getAllProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }
    
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getActiveProducts() {
        List<ProductDto> products = productService.getActiveProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }
    
    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getLowStockProducts() {
        List<ProductDto> products = productService.getLowStockProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }
}









