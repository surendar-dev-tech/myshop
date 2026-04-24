package com.myshop.repository;

import com.myshop.entity.PurchaseReturn;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseReturnRepository extends JpaRepository<PurchaseReturn, Long> {

    boolean existsByCompany_IdAndReturnNumber(Long companyId, String returnNumber);

    @EntityGraph(attributePaths = {"supplier", "referencePurchase", "items", "items.product"})
    List<PurchaseReturn> findByCompany_IdOrderByCreatedAtDesc(Long companyId);

    @EntityGraph(attributePaths = {"supplier", "referencePurchase", "items", "items.product"})
    Optional<PurchaseReturn> findByIdAndCompany_Id(Long id, Long companyId);
}
