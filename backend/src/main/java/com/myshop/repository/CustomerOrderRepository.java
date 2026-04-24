package com.myshop.repository;

import com.myshop.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    Optional<CustomerOrder> findByIdAndCompany_Id(Long id, Long companyId);

    @Query(
            "SELECT DISTINCT o FROM CustomerOrder o "
                    + "JOIN FETCH o.items i JOIN FETCH i.product JOIN FETCH o.customer JOIN FETCH o.placedBy "
                    + "WHERE o.id = :id AND o.company.id = :companyId")
    Optional<CustomerOrder> findByIdAndCompany_IdWithItems(
            @Param("id") Long id, @Param("companyId") Long companyId);

    List<CustomerOrder> findByCompany_IdOrderByCreatedAtDesc(Long companyId);

    long countByCompany_IdAndSeenByCompanyFalse(Long companyId);

    List<CustomerOrder> findByCompany_IdAndStatusOrderByCreatedAtDesc(
            Long companyId, CustomerOrder.CustomerOrderStatus status);

    boolean existsByCompany_IdAndOrderNumber(Long companyId, String orderNumber);
}
