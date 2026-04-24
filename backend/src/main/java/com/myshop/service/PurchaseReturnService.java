package com.myshop.service;

import com.myshop.dto.PurchaseReturnRequest;
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
public class PurchaseReturnService {

    @Autowired
    private PurchaseReturnRepository purchaseReturnRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private SupplierRepository supplierRepository;

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

    public PurchaseReturn createPurchaseReturn(PurchaseReturnRequest request) {
        Long companyId = tenantService.requireCompanyId();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findByIdAndCompany_Id(request.getSupplierId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        }

        Purchase referencePurchase = null;
        if (request.getReferencePurchaseId() != null) {
            referencePurchase = purchaseRepository.findByIdAndCompany_Id(request.getReferencePurchaseId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase not found"));
        }

        PurchaseReturn pr = new PurchaseReturn();
        pr.setCompany(companyRepository.getReferenceById(companyId));
        pr.setReturnNumber(generateReturnNumber(companyId));
        pr.setSupplier(supplier);
        pr.setReferencePurchase(referencePurchase);
        pr.setUser(user);
        pr.setReturnDate(request.getReturnDate() != null ? request.getReturnDate() : LocalDate.now());
        pr.setDiscount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO);
        pr.setNotes(request.getNotes());

        List<PurchaseReturnItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PurchaseReturnRequest.PurchaseReturnItemRequest ir : request.getItems()) {
            Product product = productRepository.findByIdAndCompany_Id(ir.getProductId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + ir.getProductId()));

            PurchaseReturnItem line = new PurchaseReturnItem();
            line.setPurchaseReturn(pr);
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
            stock.setTransactionType(Stock.TransactionType.STOCK_OUT);
            stock.setNotes("Purchase return — " + pr.getReturnNumber());
            stock.setUser(user);
            stockRepository.save(stock);
        }

        pr.setTotalAmount(totalAmount);
        pr.setFinalAmount(totalAmount.subtract(pr.getDiscount()));
        pr.setItems(items);

        return purchaseReturnRepository.save(pr);
    }

    public List<PurchaseReturn> getAll() {
        Long companyId = tenantService.requireCompanyId();
        return purchaseReturnRepository.findByCompany_IdOrderByCreatedAtDesc(companyId);
    }

    public PurchaseReturn getById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        return purchaseReturnRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase return not found"));
    }

    private String generateReturnNumber(Long companyId) {
        String candidate;
        int attempts = 0;
        do {
            candidate =
                    "PR-"
                            + companyId
                            + "-"
                            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
                            + "-"
                            + (int) (Math.random() * 100000);
            attempts++;
        } while (purchaseReturnRepository.existsByCompany_IdAndReturnNumber(companyId, candidate) && attempts < 50);
        return candidate;
    }
}
