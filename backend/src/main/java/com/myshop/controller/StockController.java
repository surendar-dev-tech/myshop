package com.myshop.controller;

import com.myshop.dto.ApiResponse;
import com.myshop.dto.StockDto;
import com.myshop.entity.Stock;
import com.myshop.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/stock")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_STAFF')")
public class StockController {
    
    @Autowired
    private StockService stockService;
    
    @PostMapping("/{productId}/in")
    public ResponseEntity<ApiResponse<StockDto>> stockIn(
            @PathVariable Long productId,
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) BigDecimal unitPrice,
            @RequestParam(required = false) String notes) {
        Stock stock = stockService.addStock(productId, quantity, unitPrice, notes, Stock.TransactionType.STOCK_IN);
        StockDto stockDto = convertToDto(stock);
        return ResponseEntity.ok(ApiResponse.success("Stock added successfully", stockDto));
    }
    
    private StockDto convertToDto(Stock stock) {
        StockDto dto = new StockDto();
        dto.setId(stock.getId());
        dto.setProductId(stock.getProduct().getId());
        dto.setProductName(stock.getProduct().getName());
        dto.setQuantity(stock.getQuantity());
        dto.setTransactionType(stock.getTransactionType());
        dto.setUnitPrice(stock.getUnitPrice());
        dto.setNotes(stock.getNotes());
        if (stock.getUser() != null) {
            dto.setUserName(stock.getUser().getUsername());
        }
        dto.setCreatedAt(stock.getCreatedAt());
        return dto;
    }
    
    @PostMapping("/{productId}/out")
    public ResponseEntity<ApiResponse<StockDto>> stockOut(
            @PathVariable Long productId,
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) String notes) {
        Stock stock = stockService.addStock(productId, quantity, null, notes, Stock.TransactionType.STOCK_OUT);
        StockDto stockDto = convertToDto(stock);
        return ResponseEntity.ok(ApiResponse.success("Stock removed successfully", stockDto));
    }
    
    @GetMapping("/{productId}/history")
    public ResponseEntity<ApiResponse<List<StockDto>>> getStockHistory(@PathVariable Long productId) {
        List<Stock> history = stockService.getStockHistory(productId);
        List<StockDto> historyDto = history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(historyDto));
    }
    
    @GetMapping("/{productId}/current")
    public ResponseEntity<ApiResponse<BigDecimal>> getCurrentStock(@PathVariable Long productId) {
        BigDecimal stock = stockService.getCurrentStock(productId);
        return ResponseEntity.ok(ApiResponse.success(stock));
    }
}

