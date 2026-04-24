package com.myshop.service;

import com.myshop.dto.CreateCustomerPortalRequest;
import com.myshop.dto.ResetPortalPasswordRequest;
import com.myshop.entity.Customer;
import com.myshop.entity.User;
import com.myshop.exception.BadRequestException;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.CustomerRepository;
import com.myshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerPortalService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TenantService tenantService;

    @Transactional
    public void createPortalAccount(Long customerId, CreateCustomerPortalRequest request) {
        Long companyId = tenantService.requireCompanyId();
        Customer customer =
                customerRepository.findByIdAndCompany_Id(customerId, companyId).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (!Boolean.TRUE.equals(customer.getActive())) {
            throw new BadRequestException("Activate this customer before enabling online ordering");
        }

        userRepository
                .findByCustomerProfile_Id(customerId)
                .ifPresent(u -> {
                    throw new BadRequestException("This customer already has online ordering access");
                });

        String username = request.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username is already taken");
        }

        String email = customer.getEmail() != null ? customer.getEmail().trim() : "";
        if (!email.isEmpty() && userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered to another account");
        }

        String phone = customer.getPhone() != null ? customer.getPhone().trim() : "";
        if (phone.isEmpty()) {
            throw new BadRequestException("Set a phone number on the customer before enabling online ordering");
        }

        User user = new User();
        user.setCompany(customer.getCompany());
        user.setCustomerProfile(customer);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(customer.getName());
        user.setEmail(email.isEmpty() ? null : email);
        user.setPhone(phone);
        user.setRole(User.Role.CUSTOMER);
        user.setActive(true);
        userRepository.save(user);
    }

    @Transactional
    public void revokePortalAccount(Long customerId) {
        Long companyId = tenantService.requireCompanyId();
        customerRepository.findByIdAndCompany_Id(customerId, companyId).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        User portal =
                userRepository
                        .findByCustomerProfile_Id(customerId)
                        .orElseThrow(() -> new BadRequestException("This customer does not have online ordering access"));

        userRepository.delete(portal);
    }

    @Transactional
    public void resetPortalPassword(Long customerId, ResetPortalPasswordRequest request) {
        Long companyId = tenantService.requireCompanyId();
        customerRepository.findByIdAndCompany_Id(customerId, companyId).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        User portal =
                userRepository
                        .findByCustomerProfile_Id(customerId)
                        .orElseThrow(() -> new BadRequestException("This customer does not have online ordering access"));

        portal.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(portal);
    }

    /** Call when customer is deactivated — blocks portal login without deleting the User row. */
    @Transactional
    public void deactivatePortalUserIfExists(Long customerId) {
        userRepository.findByCustomerProfile_Id(customerId).ifPresent(u -> {
            u.setActive(false);
            userRepository.save(u);
        });
    }
}
