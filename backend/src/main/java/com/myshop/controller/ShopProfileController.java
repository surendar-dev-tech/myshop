package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.ShopProfileDto;
import com.myshop.service.ShopProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/shop-profile")
@CrossOrigin(origins = "*")
public class ShopProfileController {
    
    @Autowired
    private ShopProfileService shopProfileService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<ShopProfileDto>> getShopProfile() {
        ShopProfileDto profile = shopProfileService.getShopProfile();
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
    public ResponseEntity<ApiResponse<ShopProfileDto>> saveShopProfile(@Valid @RequestBody ShopProfileDto profileDto) {
        ShopProfileDto saved = shopProfileService.saveShopProfile(profileDto);
        return ResponseEntity.ok(ApiResponse.success("Shop profile saved successfully", saved));
    }
    
    @PutMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
    public ResponseEntity<ApiResponse<ShopProfileDto>> updateShopProfile(@Valid @RequestBody ShopProfileDto profileDto) {
        ShopProfileDto saved = shopProfileService.saveShopProfile(profileDto);
        return ResponseEntity.ok(ApiResponse.success("Shop profile updated successfully", saved));
    }
}









