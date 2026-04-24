package com.myshop.repository;

import com.myshop.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCompany_IdAndPhone(Long companyId, String phone);

    List<Customer> findByCompany_Id(Long companyId);

    long countByCompany_Id(Long companyId);

    List<Customer> findByCompany_IdAndActiveTrue(Long companyId);

    long countByCompany_IdAndActiveTrue(Long companyId);

    Optional<Customer> findByIdAndCompany_Id(Long id, Long companyId);

    List<Customer> findByCompany_IdAndNameContainingIgnoreCase(Long companyId, String name);
}
