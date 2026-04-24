package com.myshop.repository;

import com.myshop.entity.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {
    List<PurchaseItem> findByPurchaseId(Long purchaseId);
    List<PurchaseItem> findByProductId(Long productId);
}









