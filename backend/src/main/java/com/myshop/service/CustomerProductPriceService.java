package com.myshop.service;

import com.myshop.dto.CustomerProductPriceDto;
import com.myshop.dto.UpsertCustomerProductPriceRequest;
import com.myshop.entity.Company;
import com.myshop.entity.Customer;
import com.myshop.entity.CustomerProductPrice;
import com.myshop.entity.Product;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.CompanyRepository;
import com.myshop.repository.CustomerProductPriceRepository;
import com.myshop.repository.CustomerRepository;
import com.myshop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerProductPriceService {

    @Autowired
    private CustomerProductPriceRepository customerProductPriceRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private TenantService tenantService;

    public List<CustomerProductPriceDto> listByCustomer(Long customerId) {
        Long companyId = tenantService.requireCompanyId();
        customerRepository
                .findByIdAndCompany_Id(customerId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        return customerProductPriceRepository.findByCompany_IdAndCustomer_Id(companyId, customerId).stream()
                .map(this::toDto)
                .toList();
    }

    public CustomerProductPriceDto upsert(UpsertCustomerProductPriceRequest request) {
        Long companyId = tenantService.requireCompanyId();
        Customer customer = customerRepository
                .findByIdAndCompany_Id(request.getCustomerId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        Product product = productRepository
                .findByIdAndCompany_Id(request.getProductId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        Company company = companyRepository.getReferenceById(companyId);

        CustomerProductPrice row = customerProductPriceRepository
                .findByCompany_IdAndCustomer_IdAndProduct_Id(companyId, customer.getId(), product.getId())
                .orElseGet(CustomerProductPrice::new);
        row.setCompany(company);
        row.setCustomer(customer);
        row.setProduct(product);
        row.setUnitPrice(request.getUnitPrice());
        CustomerProductPrice saved = customerProductPriceRepository.save(row);
        return toDto(saved);
    }

    public void delete(Long id) {
        Long companyId = tenantService.requireCompanyId();
        CustomerProductPrice row = customerProductPriceRepository
                .findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer price not found"));
        customerProductPriceRepository.delete(row);
    }

    public void deleteByCustomerAndProduct(Long customerId, Long productId) {
        Long companyId = tenantService.requireCompanyId();
        customerRepository
                .findByIdAndCompany_Id(customerId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        productRepository
                .findByIdAndCompany_Id(productId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        customerProductPriceRepository.deleteByCompany_IdAndCustomer_IdAndProduct_Id(
                companyId, customerId, productId);
    }

    private CustomerProductPriceDto toDto(CustomerProductPrice e) {
        return new CustomerProductPriceDto(
                e.getId(),
                e.getCustomer().getId(),
                e.getProduct().getId(),
                e.getProduct().getName(),
                e.getUnitPrice());
    }
}
