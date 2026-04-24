package com.myshop.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

/**
 * Authenticated user with tenant (company) context for multi-tenancy.
 */
public class ShopUserDetails implements UserDetails {

    private final Long id;
    private final Long companyId;
    private final String username;
    private final String password;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public ShopUserDetails(
            Long id,
            Long companyId,
            String username,
            String password,
            boolean active,
            Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.companyId = companyId;
        this.username = username;
        this.password = password;
        this.active = active;
        this.authorities = authorities;
    }

    public Long getId() {
        return id;
    }

    public Long getCompanyId() {
        return companyId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
