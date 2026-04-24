package com.myshop.repository;

import com.myshop.entity.CreditTransaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, Long> {
    @EntityGraph(attributePaths = {"sale", "customer"})
    List<CreditTransaction> findByCustomerId(Long customerId);
    
    @Query("SELECT COALESCE(SUM(CASE WHEN ct.transactionType = 'CREDIT_ADDED' THEN ct.amount ELSE -ct.amount END), 0) " +
           "FROM CreditTransaction ct WHERE ct.customer.id = :customerId")
    BigDecimal getOutstandingBalance(Long customerId);
    
    @Query(
            "SELECT ct.customer.id, "
                    + "COALESCE(SUM(CASE WHEN ct.transactionType = 'CREDIT_ADDED' THEN ct.amount ELSE -ct.amount END), 0) "
                    + "FROM CreditTransaction ct WHERE ct.customer.company.id = :companyId "
                    + "GROUP BY ct.customer.id "
                    + "HAVING COALESCE(SUM(CASE WHEN ct.transactionType = 'CREDIT_ADDED' THEN ct.amount ELSE -ct.amount END), 0) > 0")
    List<Object[]> getAllOutstandingBalancesForCompany(@Param("companyId") Long companyId);

    /** All customers with a balance (for joining with top-customer aggregates). */
    @Query(
            "SELECT ct.customer.id, "
                    + "COALESCE(SUM(CASE WHEN ct.transactionType = 'CREDIT_ADDED' THEN ct.amount ELSE -ct.amount END), 0) "
                    + "FROM CreditTransaction ct WHERE ct.customer.company.id = :companyId GROUP BY ct.customer.id")
    List<Object[]> getOutstandingBalancesGroupedByCustomerForCompany(@Param("companyId") Long companyId);
    
    @Query("SELECT ct FROM CreditTransaction ct WHERE ct.customer.id = :customerId AND ct.transactionType = 'CREDIT_ADDED' AND ct.dueDate IS NOT NULL AND ct.dueDate < :currentDate")
    List<CreditTransaction> findOverdueCredits(Long customerId, LocalDate currentDate);
    
    @Query(
            "SELECT ct FROM CreditTransaction ct WHERE ct.customer.company.id = :companyId AND ct.transactionType = 'CREDIT_ADDED' AND ct.dueDate IS NOT NULL AND ct.dueDate < :currentDate")
    List<CreditTransaction> findAllOverdueCreditsForCompany(
            @Param("companyId") Long companyId, @Param("currentDate") LocalDate currentDate);
    
    @Query("SELECT ct FROM CreditTransaction ct WHERE ct.customer.id = :customerId AND ct.transactionType = 'CREDIT_ADDED' ORDER BY ct.dueDate ASC")
    List<CreditTransaction> findCreditTransactionsByCustomerOrderByDueDate(Long customerId);
}

