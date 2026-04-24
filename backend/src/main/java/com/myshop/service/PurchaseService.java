package com.myshop.service;

import com.myshop.dto.PurchaseRequest;
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
public class PurchaseService {

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

    public Purchase createPurchase(PurchaseRequest purchaseRequest) {
        Long companyId = tenantService.requireCompanyId();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = null;
        if (purchaseRequest.getSupplierId() != null) {
            supplier = supplierRepository.findByIdAndCompany_Id(purchaseRequest.getSupplierId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        }

        Purchase purchase = new Purchase();
        purchase.setCompany(companyRepository.getReferenceById(companyId));
        purchase.setPurchaseNumber(generatePurchaseNumber(companyId));
        purchase.setSupplier(supplier);
        purchase.setUser(user);
        purchase.setPurchaseDate(purchaseRequest.getPurchaseDate() != null ? purchaseRequest.getPurchaseDate() : LocalDate.now());
        purchase.setDiscount(purchaseRequest.getDiscount());
        purchase.setPaymentStatus(purchaseRequest.getPaymentStatus());
        purchase.setNotes(purchaseRequest.getNotes());

        List<PurchaseItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PurchaseRequest.PurchaseItemRequest itemRequest : purchaseRequest.getItems()) {
            Product product = productRepository.findByIdAndCompany_Id(itemRequest.getProductId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemRequest.getProductId()));

            PurchaseItem item = new PurchaseItem();
            item.setPurchase(purchase);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(itemRequest.getUnitPrice());
            item.setDiscount(itemRequest.getDiscount());
            item.setBatchNumber(itemRequest.getBatchNumber());
            item.setExpiryDate(itemRequest.getExpiryDate());

            BigDecimal itemTotal = itemRequest.getQuantity()
                    .multiply(itemRequest.getUnitPrice())
                    .subtract(itemRequest.getDiscount());
            item.setTotalPrice(itemTotal);

            items.add(item);
            totalAmount = totalAmount.add(itemTotal);

            Stock stock = new Stock();
            stock.setProduct(product);
            stock.setQuantity(itemRequest.getQuantity());
            stock.setUnitPrice(itemRequest.getUnitPrice());
            stock.setTransactionType(Stock.TransactionType.STOCK_IN);
            stock.setNotes("Purchase - " + purchase.getPurchaseNumber());
            stock.setUser(user);
            stockRepository.save(stock);
        }

        purchase.setTotalAmount(totalAmount);
        purchase.setFinalAmount(totalAmount.subtract(purchaseRequest.getDiscount()));
        purchase.setItems(items);

        return purchaseRepository.save(purchase);
    }

    public List<Purchase> getAllPurchases() {
        Long companyId = tenantService.requireCompanyId();
        return purchaseRepository.findByCompany_Id(companyId);
    }

    public Purchase getPurchaseById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        return purchaseRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found"));
    }

    public List<Purchase> getPurchasesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        Long companyId = tenantService.requireCompanyId();
        return purchaseRepository.findPurchasesByDateRangeForCompany(companyId, startDate, endDate);
    }

    public List<Purchase> getPurchasesBySupplier(Long supplierId) {
        Long companyId = tenantService.requireCompanyId();
        return purchaseRepository.findByCompany_IdAndSupplierId(companyId, supplierId);
    }

    private String generatePurchaseNumber(Long companyId) {
        String candidate;
        int attempts = 0;
        do {
            candidate =
                    "PUR-"
                            + companyId
                            + "-"
                            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
                            + "-"
                            + (int) (Math.random() * 100000);
            attempts++;
        } while (purchaseRepository.existsByCompany_IdAndPurchaseNumber(companyId, candidate) && attempts < 50);
        return candidate;
    }
}
