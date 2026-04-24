package com.myshop.repository;

import com.myshop.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByCompany_IdAndName(Long companyId, String name);

    List<Supplier> findByCompany_Id(Long companyId);

    List<Supplier> findByCompany_IdAndActiveTrue(Long companyId);

    Optional<Supplier> findByIdAndCompany_Id(Long id, Long companyId);

    List<Supplier> findByCompany_IdAndNameContainingIgnoreCase(Long companyId, String name);
}
                                                                                                                                                                                        