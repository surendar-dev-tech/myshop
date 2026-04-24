package com.myshop.repository;

import com.myshop.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    @EntityGraph(attributePaths = {"product", "user"})
    List<Stock> findByProductId(Long productId);

    @EntityGraph(attributePaths = {"product", "user"})
    Optional<Stock> findById(Long id);

    @Query(
            "SELECT COALESCE(SUM(CASE WHEN s.transactionType = 'STOCK_IN' THEN s.quantity ELSE -s.quantity END), 0) "
                    + "FROM Stock s WHERE s.product.id = :productId")
    BigDecimal getCurrentStock(Long productId);

    @Query(
            "SELECT p.id, COALESCE(SUM(CASE WHEN s.transactionType = 'STOCK_IN' THEN s.quantity ELSE -s.quantity END), 0) "
                    + "FROM Stock s JOIN s.product p WHERE p.company.id = :companyId GROUP BY p.id")
    List<Object[]> getProductStockTotalsByCompany(@Param("companyId") Long companyId);
}
