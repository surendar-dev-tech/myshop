package com.myshop.repository;

import com.myshop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByCompany_IdAndBarcode(Long companyId, String barcode);

    boolean existsByCompany_IdAndName(Long companyId, String name);

    Optional<Product> findByIdAndCompany_Id(Long id, Long companyId);

    List<Product> findByCompany_Id(Long companyId);

    long countByCompany_Id(Long companyId);

    List<Product> findByCompany_IdAndActiveTrue(Long companyId);

    List<Product> findByCompany_IdAndCategory_Id(Long companyId, Long categoryId);

    @Query(
            "SELECT p FROM Product p WHERE p.company.id = :companyId AND p.active = true AND "
                    + "(SELECT COALESCE(SUM(CASE WHEN s.transactionType = 'STOCK_IN' THEN s.quantity ELSE -s.quantity END), 0) "
                    + "FROM Stock s WHERE s.product = p) <= :threshold")
    List<Product> findLowStockProducts(@Param("companyId") Long companyId, @Param("threshold") BigDecimal threshold);
}
