package com.myshop.service;

import com.myshop.entity.Product;
import com.myshop.entity.Stock;
import com.myshop.entity.User;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.ProductRepository;
import com.myshop.repository.StockRepository;
import com.myshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class StockService {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantService tenantService;

    public Stock addStock(
            Long productId,
            BigDecimal quantity,
            BigDecimal unitPrice,
            String notes,
            Stock.TransactionType transactionType) {
        Long companyId = tenantService.requireCompanyId();
        Product product = productRepository.findByIdAndCompany_Id(productId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        product.getName();

        Stock stock = new Stock();
        stock.setProduct(product);
        stock.setQuantity(quantity);
        stock.setUnitPrice(unitPrice);
        stock.setNotes(notes);
        stock.setTransactionType(transactionType);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            User user = userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            stock.setUser(user);
        }

        Stock savedStock = stockRepository.save(stock);
        return stockRepository.findById(savedStock.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found after save"));
    }

    public List<Stock> getStockHistory(Long productId) {
        Long companyId = tenantService.requireCompanyId();
        productRepository.findByIdAndCompany_Id(productId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return stockRepository.findByProductId(productId);
    }

    public BigDecimal getCurrentStock(Long productId) {
        Long companyId = tenantService.requireCompanyId();
        productRepository.findByIdAndCompany_Id(productId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        BigDecimal stock = stockRepository.getCurrentStock(productId);
        return stock != null ? stock : BigDecimal.ZERO;
    }
}
