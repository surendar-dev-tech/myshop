package com.myshop.config;

import com.myshop.entity.Company;
import com.myshop.entity.ShopProfile;
import com.myshop.entity.User;
import com.myshop.repository.CompanyRepository;
import com.myshop.repository.ShopProfileRepository;
import com.myshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds one demo company with admin/staff only when the database has no users yet.
 * If the first action is self-registration, that flow creates the company + admin instead.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ShopProfileRepository shopProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        Company demoCompany = new Company();
        demoCompany.setName("Demo Shop");
        demoCompany = companyRepository.save(demoCompany);

        ShopProfile profile = new ShopProfile();
        profile.setCompany(demoCompany);
        profile.setShopName("Demo Shop");
        profile.setInvoiceTemplate("DEFAULT");
        profile.setPrintMode("POS");
        profile.setShowLogo(false);
        shopProfileRepository.save(profile);

        User admin = new User();
        admin.setCompany(demoCompany);
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setFullName("Administrator");
        admin.setEmail("admin@myshop.com");
        admin.setPhone("1234567890");
        admin.setRole(User.Role.ADMIN);
        admin.setActive(true);
        userRepository.save(admin);

        User staff = new User();
        staff.setCompany(demoCompany);
        staff.setUsername("staff");
        staff.setPassword(passwordEncoder.encode("staff123"));
        staff.setFullName("Staff User");
        staff.setEmail("staff@myshop.com");
        staff.setPhone("0987654321");
        staff.setRole(User.Role.STAFF);
        staff.setActive(true);
        userRepository.save(staff);

        System.out.println("Default tenant created: company=Demo Shop, admin/admin123, staff/staff123");
    }
}
