package com.myshop.repository;

import com.myshop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query(
            "SELECT u FROM User u JOIN FETCH u.company LEFT JOIN FETCH u.customerProfile "
                    + "WHERE u.username = :username")
    Optional<User> findByUsername(@Param("username") String username);

    Optional<User> findByCustomerProfile_Id(Long customerProfileId);

    List<User> findByCompany_IdAndRole(Long companyId, User.Role role);

    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    List<User> findByCompany_IdOrderByUsernameAsc(Long companyId);

    long countByCompany_IdAndRoleAndActiveTrue(Long companyId, User.Role role);

    Optional<User> findByIdAndCompany_Id(Long id, Long companyId);
}









