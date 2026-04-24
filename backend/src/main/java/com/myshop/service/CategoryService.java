package com.myshop.service;

import com.myshop.entity.Category;
import com.myshop.exception.BadRequestException;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.CategoryRepository;
import com.myshop.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TenantService tenantService;

    @Autowired
    private CompanyRepository companyRepository;

    public Category createCategory(Category category) {
        Long companyId = tenantService.requireCompanyId();
        if (categoryRepository.existsByCompany_IdAndName(companyId, category.getName())) {
            throw new BadRequestException("Category with name already exists");
        }
        category.setCompany(companyRepository.getReferenceById(companyId));
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category category) {
        Long companyId = tenantService.requireCompanyId();
        Category existing = categoryRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (!existing.getName().equals(category.getName())
                && categoryRepository.existsByCompany_IdAndName(companyId, category.getName())) {
            throw new BadRequestException("Category with name already exists");
        }

        existing.setName(category.getName());
        existing.setDescription(category.getDescription());

        return categoryRepository.save(existing);
    }

    public Category getCategoryById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        return categoryRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    public List<Category> getAllCategories() {
        Long companyId = tenantService.requireCompanyId();
        return categoryRepository.findByCompany_IdOrderByNameAsc(companyId);
    }

    public void deleteCategory(Long id) {
        Long companyId = tenantService.requireCompanyId();
        Category category = categoryRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        categoryRepository.delete(category);
    }
}
