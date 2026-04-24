package com.myshop.service;

import com.myshop.dto.ProductDto;
import com.myshop.entity.Category;
import com.myshop.entity.Product;
import com.myshop.exception.BadRequestException;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.CategoryRepository;
import com.myshop.repository.CompanyRepository;
import com.myshop.repository.ProductRepository;
import com.myshop.repository.StockRepository;
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
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private TenantService tenantService;

    private static final BigDecimal LOW_STOCK_THRESHOLD = new BigDecimal("10");

    public ProductDto createProduct(ProductDto productDto) {
        Long companyId = tenantService.requireCompanyId();
        if (productRepository.existsByCompany_IdAndBarcode(companyId, productDto.getBarcode())) {
            throw new BadRequestException("Product with barcode already exists");
        }

        Product product = new Product();
        product.setCompany(companyRepository.getReferenceById(companyId));
        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setBarcode(productDto.getBarcode());
        product.setPurchasePrice(productDto.getPurchasePrice());
        product.setSellingPrice(productDto.getSellingPrice());
        product.setUnit(productDto.getUnit());
        product.setHsnCode(productDto.getHsnCode());
        product.setGstRatePercent(productDto.getGstRatePercent());
        product.setActive(productDto.getActive());

        if (productDto.getCategoryId() != null) {
            Category category = categoryRepository
                    .findByIdAndCompany_Id(productDto.getCategoryId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        Product saved = productRepository.save(product);
        return convertToDtoWithLookup(saved);
    }

    public ProductDto updateProduct(Long id, ProductDto productDto) {
        Long companyId = tenantService.requireCompanyId();
        Product product = productRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getBarcode().equals(productDto.getBarcode())
                && productRepository.existsByCompany_IdAndBarcode(companyId, productDto.getBarcode())) {
            throw new BadRequestException("Product with barcode already exists");
        }

        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setBarcode(productDto.getBarcode());
        product.setPurchasePrice(productDto.getPurchasePrice());
        product.setSellingPrice(productDto.getSellingPrice());
        product.setUnit(productDto.getUnit());
        product.setHsnCode(productDto.getHsnCode());
        product.setGstRatePercent(productDto.getGstRatePercent());
        product.setActive(productDto.getActive());

        if (productDto.getCategoryId() != null) {
            Category category = categoryRepository
                    .findByIdAndCompany_Id(productDto.getCategoryId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        Product saved = productRepository.save(product);
        return convertToDtoWithLookup(saved);
    }

    public ProductDto getProductById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        Product product = productRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return convertToDtoWithLookup(product);
    }

    public List<ProductDto> getAllProducts() {
        Long companyId = tenantService.requireCompanyId();
        Map<Long, BigDecimal> stockTotals = loadStockTotalsMap(companyId);
        return productRepository.findByCompany_Id(companyId).stream()
                .map(p -> convertToDto(p, stockTotals.getOrDefault(p.getId(), BigDecimal.ZERO)))
                .collect(Collectors.toList());
    }

    public List<ProductDto> getActiveProducts() {
        Long companyId = tenantService.requireCompanyId();
        Map<Long, BigDecimal> stockTotals = loadStockTotalsMap(companyId);
        return productRepository.findByCompany_IdAndActiveTrue(companyId).stream()
                .map(p -> convertToDto(p, stockTotals.getOrDefault(p.getId(), BigDecimal.ZERO)))
                .collect(Collectors.toList());
    }

    private Map<Long, BigDecimal> loadStockTotalsMap(Long companyId) {
        List<Object[]> rows = stockRepository.getProductStockTotalsByCompany(companyId);
        Map<Long, BigDecimal> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] != null && row[1] != null) {
                map.put((Long) row[0], (BigDecimal) row[1]);
            }
        }
        return map;
    }

    public List<ProductDto> getLowStockProducts() {
        Long companyId = tenantService.requireCompanyId();
        Map<Long, BigDecimal> stockTotals = loadStockTotalsMap(companyId);
        return productRepository.findLowStockProducts(companyId, LOW_STOCK_THRESHOLD).stream()
                .map(p -> convertToDto(p, stockTotals.getOrDefault(p.getId(), BigDecimal.ZERO)))
                .collect(Collectors.toList());
    }

    public void deleteProduct(Long id) {
        Long companyId = tenantService.requireCompanyId();
        Product product = productRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setActive(false);
        productRepository.save(product);
    }

    private ProductDto convertToDtoWithLookup(Product product) {
        BigDecimal currentStock = stockRepository.getCurrentStock(product.getId());
        return convertToDto(product, currentStock);
    }

    private ProductDto convertToDto(Product product, BigDecimal currentStock) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setBarcode(product.getBarcode());
        dto.setPurchasePrice(product.getPurchasePrice());
        dto.setSellingPrice(product.getSellingPrice());
        dto.setUnit(product.getUnit());
        dto.setHsnCode(product.getHsnCode());
        dto.setGstRatePercent(product.getGstRatePercent());
        dto.setActive(product.getActive());

        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
        }

        dto.setCurrentStock(currentStock);
        dto.setLowStock(currentStock.compareTo(LOW_STOCK_THRESHOLD) <= 0);

        return dto;
    }
}
