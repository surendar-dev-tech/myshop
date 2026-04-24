package com.myshop.repository;

import com.myshop.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    boolean existsByCompany_IdAndPurchaseNumber(Long companyId, String purchaseNumber);

    @EntityGraph(attributePaths = {"supplier", "user", "items", "items.product"})
    List<Purchase> findByCompany_IdAndSupplierId(Long companyId, Long supplierId);

    @EntityGraph(attributePaths = {"supplier", "user", "items", "items.product"})
    @Query(
            "SELECT p FROM Purchase p WHERE p.company.id = :companyId AND p.createdAt >= :startDate AND p.createdAt <= :endDate")
    List<Purchase> findPurchasesByDateRangeForCompany(
            @Param("companyId") Long companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT SUM(p.finalAmount) FROM Purchase p WHERE p.company.id = :companyId AND p.createdAt >= :startDate AND p.createdAt <= :endDate")
    Double getTotalPurchasesByDateRangeForCompany(
            @Param("companyId") Long companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @EntityGraph(attributePaths = {"supplier", "user", "items", "items.product"})
    List<Purchase> findByCompany_Id(Long companyId);

    @EntityGraph(attributePaths = {"supplier", "user", "items", "items.product"})
    Optional<Purchase> findByIdAndCompany_Id(Long id, Long companyId);

    @EntityGraph(attributePaths = {"supplier", "user", "items", "items.product"})
    Optional<Purchase> findById(Long id);
}
