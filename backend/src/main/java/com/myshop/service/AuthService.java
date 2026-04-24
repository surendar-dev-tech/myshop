package com.myshop.service;

import com.myshop.dto.JwtResponse;
import com.myshop.dto.LoginRequest;
import com.myshop.dto.RegisterRequest;
import com.myshop.entity.Company;
import com.myshop.entity.ShopProfile;
import com.myshop.entity.User;
import com.myshop.exception.BadRequestException;
import com.myshop.repository.CompanyRepository;
import com.myshop.repository.ShopProfileRepository;
import com.myshop.repository.UserRepository;
import com.myshop.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ShopProfileRepository shopProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public JwtResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long customerProfileId =
                user.getCustomerProfile() != null ? user.getCustomerProfile().getId() : null;
        return new JwtResponse(
                jwt,
                "Bearer",
                user.getUsername(),
                user.getRole().name(),
                user.getCompany().getId(),
                user.getCompany().getName(),
                customerProfileId);
    }

    @Transactional
    public JwtResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username is already taken");
        }

        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        if (!email.isEmpty() && userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered");
        }

        Company company = new Company();
        company.setName(request.getCompanyName().trim());
        company = companyRepository.save(company);

        User user = new User();
        user.setCompany(company);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setEmail(email.isEmpty() ? null : email);
        user.setPhone(request.getPhone().trim());
        user.setRole(User.Role.ADMIN);
        user.setActive(true);
        userRepository.save(user);

        ShopProfile profile = new ShopProfile();
        profile.setCompany(company);
        profile.setShopName(request.getCompanyName().trim());
        profile.setInvoiceTemplate("DEFAULT");
        profile.setPrintMode("POS");
        profile.setShowLogo(false);
        shopProfileRepository.save(profile);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return new JwtResponse(
                jwt,
                "Bearer",
                user.getUsername(),
                user.getRole().name(),
                company.getId(),
                company.getName(),
                null);
    }
}
