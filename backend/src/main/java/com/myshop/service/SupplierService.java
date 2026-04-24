package com.myshop.service;

import com.myshop.entity.Supplier;
import com.myshop.exception.BadRequestException;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.CompanyRepository;
import com.myshop.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private TenantService tenantService;

    public Supplier createSupplier(Supplier supplier) {
        Long companyId = tenantService.requireCompanyId();
        if (supplierRepository.findByCompany_IdAndName(companyId, supplier.getName()).isPresent()) {
            throw new BadRequestException("Supplier with name already exists");
        }
        supplier.setCompany(companyRepository.getReferenceById(companyId));
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Long id, Supplier supplier) {
        Long companyId = tenantService.requireCompanyId();
        Supplier existing = supplierRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        if (!existing.getName().equals(supplier.getName())
                && supplierRepository.findByCompany_IdAndName(companyId, supplier.getName()).isPresent()) {
            throw new BadRequestException("Supplier with name already exists");
        }

        existing.setName(supplier.getName());
        existing.setCompanyName(supplier.getCompanyName());
        existing.setPhone(supplier.getPhone());
        existing.setEmail(supplier.getEmail());
        existing.setAddress(supplier.getAddress());
        existing.setCity(supplier.getCity());
        existing.setState(supplier.getState());
        existing.setPincode(supplier.getPincode());
        existing.setGstNumber(supplier.getGstNumber());
        existing.setPanNumber(supplier.getPanNumber());
        existing.setNotes(supplier.getNotes());
        existing.setActive(supplier.getActive());

        return supplierRepository.save(existing);
    }

    public Supplier getSupplierById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        return supplierRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
    }

    public List<Supplier> getAllSuppliers() {
        Long companyId = tenantService.requireCompanyId();
        return supplierRepository.findByCompany_Id(companyId);
    }

    public List<Supplier> getActiveSuppliers() {
        Long companyId = tenantService.requireCompanyId();
        return supplierRepository.findByCompany_IdAndActiveTrue(companyId);
    }

    public void deleteSupplier(Long id) {
        Long companyId = tenantService.requireCompanyId();
        Supplier supplier = supplierRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }
}
