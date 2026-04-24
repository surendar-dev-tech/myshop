package com.myshop.repository;

import com.myshop.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findBySaleId(Long saleId);
    List<Payment> findByCustomerId(Long customerId);
}









