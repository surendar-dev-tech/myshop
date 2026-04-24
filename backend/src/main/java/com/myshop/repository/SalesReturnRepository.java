package com.myshop.repository;

import com.myshop.entity.SalesReturn;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {

    boolean existsByCompany_IdAndReturnNumber(Long companyId, String returnNumber);

    @EntityGraph(attributePaths = {"customer", "referenceSale", "items", "items.product"})
    List<SalesReturn> findByCompany_IdOrderByCreatedAtDesc(Long companyId);

    @EntityGraph(attributePaths = {"customer", "referenceSale", "items", "items.product"})
    Optional<SalesReturn> findByIdAndCompany_Id(Long id, Long companyId);
}
