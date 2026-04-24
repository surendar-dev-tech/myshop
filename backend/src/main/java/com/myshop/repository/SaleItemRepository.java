package com.myshop.repository;

import com.myshop.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    List<SaleItem> findBySaleId(Long saleId);
    List<SaleItem> findByProductId(Long productId);
    
    @Query("SELECT si FROM SaleItem si WHERE si.sale.createdAt >= :startDate AND si.sale.createdAt <= :endDate AND si.product.id = :productId")
    List<SaleItem> findByProductIdAndDateRange(Long productId, LocalDateTime startDate, LocalDateTime endDate);
}









