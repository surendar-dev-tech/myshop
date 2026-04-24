package com.myshop.service;

import com.myshop.entity.Customer;
import com.myshop.exception.BadRequestException;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.entity.User;
import com.myshop.repository.CompanyRepository;
import com.myshop.repository.CreditTransactionRepository;
import com.myshop.repository.CustomerRepository;
import com.myshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CreditService creditService;

    @Autowired
    private CreditTransactionRepository creditTransactionRepository;

    @Autowired
    private TenantService tenantService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerPortalService customerPortalService;

    public Customer createCustomer(Customer customer) {
        Long companyId = tenantService.requireCompanyId();
        if (customer.getPhone() != null
                && customerRepository.findByCompany_IdAndPhone(companyId, customer.getPhone()).isPresent()) {
            throw new BadRequestException("Customer with phone number already exists");
        }
        customer.setCompany(companyRepository.getReferenceById(companyId));
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer customer) {
        Long companyId = tenantService.requireCompanyId();
        Customer existing = customerRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (customer.getPhone() != null
                && !customer.getPhone().equals(existing.getPhone())
                && customerRepository.findByCompany_IdAndPhone(companyId, customer.getPhone()).isPresent()) {
            throw new BadRequestException("Customer with phone number already exists");
        }

        existing.setName(customer.getName());
        existing.setPhone(customer.getPhone());
        existing.setEmail(customer.getEmail());
        existing.setAddress(customer.getAddress());
        existing.setActive(customer.getActive());

        Customer saved = customerRepository.save(existing);
        if (Boolean.FALSE.equals(saved.getActive())) {
            customerPortalService.deactivatePortalUserIfExists(saved.getId());
        } else {
            syncPortalUserFromCustomer(saved);
        }
        return saved;
    }

    public Customer getCustomerById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        Customer customer = customerRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        BigDecimal balance = creditTransactionRepository.getOutstandingBalance(id);
        customer.setOutstandingBalance(balance != null ? balance : BigDecimal.ZERO);

        enrichPortalInfo(List.of(customer), companyId);
        return customer;
    }

    public List<Customer> getAllCustomers() {
        Long companyId = tenantService.requireCompanyId();
        List<Customer> list =
                customerRepository.findByCompany_Id(companyId).stream()
                        .map(
                                customer -> {
                                    BigDecimal balance =
                                            creditTransactionRepository.getOutstandingBalance(customer.getId());
                                    customer.setOutstandingBalance(balance != null ? balance : BigDecimal.ZERO);
                                    return customer;
                                })
                        .collect(Collectors.toList());
        enrichPortalInfo(list, companyId);
        return list;
    }

    public List<Customer> getActiveCustomers() {
        Long companyId = tenantService.requireCompanyId();
        List<Customer> list = customerRepository.findByCompany_IdAndActiveTrue(companyId);
        enrichPortalInfo(list, companyId);
        return list;
    }

    public void deleteCustomer(Long id) {
        Long companyId = tenantService.requireCompanyId();
        Customer customer = customerRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        customer.setActive(false);
        customerRepository.save(customer);
        customerPortalService.deactivatePortalUserIfExists(id);
    }

    private void syncPortalUserFromCustomer(Customer saved) {
        userRepository
                .findByCustomerProfile_Id(saved.getId())
                .ifPresent(
                        u -> {
                            u.setFullName(saved.getName());
                            if (saved.getPhone() != null) {
                                u.setPhone(saved.getPhone().trim());
                            }
                            if (saved.getEmail() != null && !saved.getEmail().trim().isEmpty()) {
                                u.setEmail(saved.getEmail().trim());
                            } else {
                                u.setEmail(null);
                            }
                            userRepository.save(u);
                        });
    }

    private void enrichPortalInfo(List<Customer> customers, Long companyId) {
        if (customers.isEmpty()) {
            return;
        }
        List<User> portalUsers = userRepository.findByCompany_IdAndRole(companyId, User.Role.CUSTOMER);
        Map<Long, User> byCustomerId = new HashMap<>();
        for (User u : portalUsers) {
            if (u.getCustomerProfile() != null) {
                byCustomerId.put(u.getCustomerProfile().getId(), u);
            }
        }
        for (Customer c : customers) {
            User u = byCustomerId.get(c.getId());
            c.setOnlineOrderingEnabled(u != null && Boolean.TRUE.equals(u.getActive()));
            c.setPortalUsername(u != null ? u.getUsername() : null);
        }
    }

    public BigDecimal getCustomerBalance(Long id) {
        return creditService.getOutstandingBalance(id);
    }
}
