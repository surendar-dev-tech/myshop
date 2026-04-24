package com.myshop.service;

import com.myshop.dto.SalesReturnRequest;
import com.myshop.entity.*;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class SalesReturnService {

    @Autowired
    private SalesReturnRepository salesReturnRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private TenantService tenantService;

    public SalesReturn createSalesReturn(SalesReturnRequest request) {
        Long companyId = tenantService.requireCompanyId();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findByIdAndCompany_Id(request.getCustomerId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Sale referenceSale = null;
        if (request.getReferenceSaleId() != null) {
            referenceSale = saleRepository.findByIdAndCompany_Id(request.getReferenceSaleId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        }

        SalesReturn sr = new SalesReturn();
        sr.setCompany(companyRepository.getReferenceById(companyId));
        sr.setReturnNumber(generateReturnNumber(companyId));
        sr.setCustomer(customer);
        sr.setReferenceSale(referenceSale);
        sr.setUser(user);
        sr.setReturnDate(request.getReturnDate() != null ? request.getReturnDate() : LocalDate.now());
        sr.setDiscount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO);
        sr.setNotes(request.getNotes());

        List<SalesReturnItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SalesReturnRequest.SalesReturnItemRequest ir : request.getItems()) {
            Product product = productRepository.findByIdAndCompany_Id(ir.getProductId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + ir.getProductId()));

            SalesReturnItem line = new SalesReturnItem();
            line.setSalesReturn(sr);
            line.setProduct(product);
            line.setQuantity(ir.getQuantity());
            line.setUnitPrice(ir.getUnitPrice());
            line.setDiscount(ir.getDiscount() != null ? ir.getDiscount() : BigDecimal.ZERO);

            BigDecimal lineTotal =
                    ir.getQuantity()
                            .multiply(ir.getUnitPrice())
                            .subtract(line.getDiscount());
            line.setTotalPrice(lineTotal);

            items.add(line);
            totalAmount = totalAmount.add(lineTotal);

            Stock stock = new Stock();
            stock.setProduct(product);
            stock.setQuantity(ir.getQuantity());
            stock.setUnitPrice(ir.getUnitPrice());
            stock.setTransactionType(Stock.TransactionType.STOCK_IN);
            stock.setNotes("Sales return — " + sr.getReturnNumber());
            stock.setUser(user);
            stockRepository.save(stock);
        }

        sr.setTotalAmount(totalAmount);
        sr.setFinalAmount(totalAmount.subtract(sr.getDiscount()));
        sr.setItems(items);

        return salesReturnRepository.save(sr);
    }

    public List<SalesReturn> getAll() {
        Long companyId = tenantService.requireCompanyId();
        return salesReturnRepository.findByCompany_IdOrderByCreatedAtDesc(companyId);
    }

    public SalesReturn getById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        return salesReturnRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Sales return not found"));
    }

    private String generateReturnNumber(Long companyId) {
        String candidate;
        int attempts = 0;
        do {
            candidate =
                    "SR-"
                            + companyId
                            + "-"
                            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
                            + "-"
                            + (int) (Math.random() * 100000);
            attempts++;
        } while (salesReturnRepository.existsByCompany_IdAndReturnNumber(companyId, candidate) && attempts < 50);
        return candidate;
    }
}
