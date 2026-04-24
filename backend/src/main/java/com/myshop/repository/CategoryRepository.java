package com.myshop.repository;

import com.myshop.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByCompany_IdAndName(Long companyId, String name);

    Optional<Category> findByIdAndCompany_Id(Long id, Long companyId);

    List<Category> findByCompany_IdOrderByNameAsc(Long companyId);
}
