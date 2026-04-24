package com.myshop.repository;

import com.myshop.entity.CustomerProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerProductPriceRepository extends JpaRepository<CustomerProductPrice, Long> {

    List<CustomerProductPrice> findByCompany_IdAndCustomer_Id(Long companyId, Long customerId);

    Optional<CustomerProductPrice> findByCompany_IdAndCustomer_IdAndProduct_Id(
            Long companyId, Long customerId, Long productId);

    Optional<CustomerProductPrice> findByIdAndCompany_Id(Long id, Long companyId);

    void deleteByCompany_IdAndCustomer_IdAndProduct_Id(Long companyId, Long customerId, Long productId);
}
