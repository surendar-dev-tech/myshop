package com.myshop.service;

import com.myshop.dto.CreateUserRequest;
import com.myshop.dto.ResetPasswordRequest;
import com.myshop.dto.UpdateUserRequest;
import com.myshop.dto.UserDto;
import com.myshop.entity.User;
import com.myshop.exception.BadRequestException;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.CompanyRepository;
import com.myshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserManagementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TenantService tenantService;

    public List<UserDto> listAll() {
        Long companyId = tenantService.requireCompanyId();
        return userRepository.findByCompany_IdOrderByUsernameAsc(companyId).stream()
                .filter(u -> u.getRole() != User.Role.CUSTOMER)
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto create(CreateUserRequest request) {
        Long companyId = tenantService.requireCompanyId();
        String username = request.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username is already taken");
        }
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        if (!email.isEmpty() && userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered");
        }

        User user = new User();
        user.setCompany(companyRepository.getReferenceById(companyId));
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setEmail(email.isEmpty() ? null : email);
        user.setPhone(request.getPhone().trim());
        user.setRole(User.Role.STAFF);
        user.setActive(true);
        userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto update(Long id, UpdateUserRequest request) {
        Long companyId = tenantService.requireCompanyId();
        User user = userRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        if (!email.isEmpty()) {
            userRepository.findByEmail(email).ifPresent(other -> {
                if (!other.getId().equals(user.getId())) {
                    throw new BadRequestException("Email is already registered");
                }
            });
        }
        user.setFullName(request.getFullName().trim());
        user.setEmail(email.isEmpty() ? null : email);
        user.setPhone(request.getPhone().trim());
        userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public void setActive(Long id, boolean active, String currentUsername) {
        Long companyId = tenantService.requireCompanyId();
        User user = userRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!active) {
            if (user.getUsername().equals(currentUsername)) {
                throw new BadRequestException("You cannot deactivate your own account");
            }
            if (user.getRole() == User.Role.ADMIN) {
                long activeAdmins = userRepository.countByCompany_IdAndRoleAndActiveTrue(companyId, User.Role.ADMIN);
                if (activeAdmins <= 1) {
                    throw new BadRequestException("Cannot deactivate the last administrator");
                }
            }
        }

        user.setActive(active);
        userRepository.save(user);
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        Long companyId = tenantService.requireCompanyId();
        User user = userRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
