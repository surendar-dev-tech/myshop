package com.myshop.repository;

import com.myshop.entity.ShopProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShopProfileRepository extends JpaRepository<ShopProfile, Long> {
    Optional<ShopProfile> findByCompany_Id(Long companyId);
}









