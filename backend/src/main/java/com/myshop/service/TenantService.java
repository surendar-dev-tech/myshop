package com.myshop.service;

import com.myshop.exception.BadRequestException;
import com.myshop.security.ShopUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class TenantService {

    public Long requireCompanyId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof ShopUserDetails sud) {
            return sud.getCompanyId();
        }
        throw new BadRequestException("Not authenticated");
    }
}
