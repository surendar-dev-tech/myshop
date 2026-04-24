package com.myshop.repository;

import com.myshop.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    boolean existsByCompany_IdAndInvoiceNumber(Long companyId, String invoiceNumber);

    @EntityGraph(attributePaths = {"customer", "user", "items", "items.product"})
    List<Sale> findByCompany_IdAndCreatedAtBetween(Long companyId, LocalDateTime start, LocalDateTime end);

    @Query(
            "SELECT SUM(s.finalAmount) FROM Sale s WHERE s.company.id = :companyId AND s.createdAt >= :startDate AND s.createdAt <= :endDate")
    Double getTotalSalesByDateRangeForCompany(
            @Param("companyId") Long companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    long countByCompany_IdAndCreatedAtBetween(Long companyId, LocalDateTime startDate, LocalDateTime endDate);

    @EntityGraph(attributePaths = {"customer", "user", "items", "items.product"})
    @Query(
            "SELECT s FROM Sale s WHERE s.company.id = :companyId AND s.createdAt >= :startDate AND s.createdAt <= :endDate")
    List<Sale> findSalesByDateRangeForCompany(
            @Param("companyId") Long companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT s.customer.id, COUNT(s), COALESCE(SUM(s.finalAmount), 0) FROM Sale s WHERE s.company.id = :companyId AND s.customer IS NOT NULL GROUP BY s.customer.id")
    List<Object[]> getCustomerSaleAggregatesForCompany(@Param("companyId") Long companyId);

    @Query(
            value =
                    "SELECT DATE(s.created_at), COALESCE(SUM(s.final_amount), 0) "
                            + "FROM sales s WHERE s.company_id = :companyId AND s.created_at >= :startDate AND s.created_at <= :endDate "
                            + "GROUP BY DATE(s.created_at) ORDER BY DATE(s.created_at)",
            nativeQuery = true)
    List<Object[]> getDailySalesTotalsForCompany(
            @Param("companyId") Long companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @EntityGraph(attributePaths = {"customer", "user", "items", "items.product"})
    @Query("SELECT s FROM Sale s WHERE s.company.id = :companyId ORDER BY s.createdAt DESC")
    List<Sale> findByCompany_IdOrderByCreatedAtDesc(@Param("companyId") Long companyId);

    @EntityGraph(attributePaths = {"customer", "user", "items", "items.product"})
    Optional<Sale> findByIdAndCompany_Id(Long id, Long companyId);

    @EntityGraph(attributePaths = {"customer", "user", "items", "items.product"})
    List<Sale> findByCompany_IdAndCustomerId(Long companyId, Long customerId);

    @EntityGraph(attributePaths = {"customer", "user", "items", "items.product"})
    Optional<Sale> findById(Long id);
}
