package com.myshop.service;

import com.myshop.dto.ShopProfileDto;
import com.myshop.entity.ShopProfile;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.ShopProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ShopProfileService {

    @Autowired
    private ShopProfileRepository shopProfileRepository;

    @Autowired
    private TenantService tenantService;

    public ShopProfileDto getShopProfile() {
        Long companyId = tenantService.requireCompanyId();
        ShopProfile profile = shopProfileRepository.findByCompany_Id(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop profile not found"));
        return convertToDto(profile);
    }

    public ShopProfileDto saveShopProfile(ShopProfileDto profileDto) {
        Long companyId = tenantService.requireCompanyId();
        ShopProfile profile = shopProfileRepository.findByCompany_Id(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop profile not found"));

        profile.setShopName(profileDto.getShopName());
        profile.setAddress(profileDto.getAddress());
        profile.setPhone(profileDto.getPhone());
        profile.setEmail(profileDto.getEmail());
        profile.setGstNumber(profileDto.getGstNumber());
        profile.setGstStateCode(profileDto.getGstStateCode());
        profile.setPanNumber(profileDto.getPanNumber());
        profile.setWebsite(profileDto.getWebsite());
        profile.setFooterMessage(profileDto.getFooterMessage());
        profile.setTermsAndConditions(profileDto.getTermsAndConditions());
        profile.setInvoiceHeader(profileDto.getInvoiceHeader());
        profile.setInvoiceFooter(profileDto.getInvoiceFooter());
        profile.setShowLogo(profileDto.getShowLogo() != null ? profileDto.getShowLogo() : false);
        profile.setLogoUrl(profileDto.getLogoUrl());
        profile.setInvoiceTemplate(profileDto.getInvoiceTemplate() != null ? profileDto.getInvoiceTemplate() : "DEFAULT");
        profile.setPrintMode(profileDto.getPrintMode() != null ? profileDto.getPrintMode() : "POS");
        profile.setProfilePicture(profileDto.getProfilePicture());

        ShopProfile saved = shopProfileRepository.save(profile);
        return convertToDto(saved);
    }

    private ShopProfileDto convertToDto(ShopProfile profile) {
        ShopProfileDto dto = new ShopProfileDto();
        dto.setId(profile.getId());
        dto.setShopName(profile.getShopName());
        dto.setAddress(profile.getAddress());
        dto.setPhone(profile.getPhone());
        dto.setEmail(profile.getEmail());
        dto.setGstNumber(profile.getGstNumber());
        dto.setGstStateCode(profile.getGstStateCode());
        dto.setPanNumber(profile.getPanNumber());
        dto.setWebsite(profile.getWebsite());
        dto.setFooterMessage(profile.getFooterMessage());
        dto.setTermsAndConditions(profile.getTermsAndConditions());
        dto.setInvoiceHeader(profile.getInvoiceHeader());
        dto.setInvoiceFooter(profile.getInvoiceFooter());
        dto.setShowLogo(profile.getShowLogo());
        dto.setLogoUrl(profile.getLogoUrl());
        dto.setInvoiceTemplate(profile.getInvoiceTemplate());
        dto.setPrintMode(profile.getPrintMode());
        dto.setProfilePicture(profile.getProfilePicture());
        return dto;
    }
}
