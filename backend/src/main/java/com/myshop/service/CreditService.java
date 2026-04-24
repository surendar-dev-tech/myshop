package com.myshop.service;

import com.myshop.dto.OutstandingCreditDto;
import com.myshop.entity.CreditTransaction;
import com.myshop.entity.Customer;
import com.myshop.entity.Payment;
import com.myshop.entity.User;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.CreditTransactionRepository;
import com.myshop.repository.CustomerRepository;
import com.myshop.repository.PaymentRepository;
import com.myshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.temporal.ChronoUnit;

@Service
@Transactional
public class CreditService {

    @Autowired
    private CreditTransactionRepository creditTransactionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantService tenantService;

    public CreditTransaction recordCreditPayment(Long customerId, BigDecimal amount, String notes) {
        Long companyId = tenantService.requireCompanyId();
        Customer customer = customerRepository.findByIdAndCompany_Id(customerId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setAmount(amount);
        payment.setPaymentType(Payment.PaymentType.CREDIT_PAYMENT);
        payment.setNotes(notes);
        payment.setUser(user);
        Payment savedPayment = paymentRepository.save(payment);

        CreditTransaction creditTransaction = new CreditTransaction();
        creditTransaction.setCustomer(customer);
        creditTransaction.setPayment(savedPayment);
        creditTransaction.setAmount(amount);
        creditTransaction.setTransactionType(CreditTransaction.TransactionType.CREDIT_PAID);
        creditTransaction.setNotes(notes);
        creditTransaction.setUser(user);
        creditTransaction.setPaymentDate(LocalDate.now());

        CreditTransaction saved = creditTransactionRepository.save(creditTransaction);

        BigDecimal newBalance = getOutstandingBalance(customerId).subtract(amount);
        customer.setCurrentCredit(newBalance);
        customerRepository.save(customer);

        return saved;
    }

    public List<CreditTransaction> getCustomerCreditHistory(Long customerId) {
        Long companyId = tenantService.requireCompanyId();
        customerRepository.findByIdAndCompany_Id(customerId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        return creditTransactionRepository.findByCustomerId(customerId);
    }

    public BigDecimal getOutstandingBalance(Long customerId) {
        BigDecimal balance = creditTransactionRepository.getOutstandingBalance(customerId);
        return balance != null ? balance : BigDecimal.ZERO;
    }

    public List<Object[]> getAllOutstandingBalances() {
        Long companyId = tenantService.requireCompanyId();
        return creditTransactionRepository.getAllOutstandingBalancesForCompany(companyId);
    }

    public List<OutstandingCreditDto> getAllOutstandingCreditsWithDetails() {
        Long companyId = tenantService.requireCompanyId();
        List<Object[]> balances = creditTransactionRepository.getAllOutstandingBalancesForCompany(companyId);
        return balances.stream()
                .map(
                        item -> {
                            Long customerId = ((Number) item[0]).longValue();
                            BigDecimal balance = (BigDecimal) item[1];

                            Customer customer = customerRepository.findByIdAndCompany_Id(customerId, companyId).orElse(null);
                            OutstandingCreditDto dto = new OutstandingCreditDto();
                            dto.setCustomerId(customerId);
                            dto.setCustomerName(customer != null ? customer.getName() : "Unknown");
                            dto.setCustomerPhone(customer != null ? customer.getPhone() : null);
                            dto.setOutstandingBalance(balance);
                            return dto;
                        })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getCreditAgingReport() {
        Long companyId = tenantService.requireCompanyId();
        LocalDate currentDate = LocalDate.now();
        List<CreditTransaction> allCredits =
                creditTransactionRepository.findAll().stream()
                        .filter(ct -> ct.getTransactionType() == CreditTransaction.TransactionType.CREDIT_ADDED)
                        .filter(ct -> ct.getCustomer() != null && ct.getCustomer().getCompany().getId().equals(companyId))
                        .collect(Collectors.toList());

        Map<String, BigDecimal> aging = new HashMap<>();
        aging.put("current", BigDecimal.ZERO);
        aging.put("days31_60", BigDecimal.ZERO);
        aging.put("days61_90", BigDecimal.ZERO);
        aging.put("over90", BigDecimal.ZERO);

        Map<Long, BigDecimal> customerBalances = new HashMap<>();
        for (CreditTransaction credit : allCredits) {
            Long customerId = credit.getCustomer().getId();
            BigDecimal balance = getOutstandingBalance(customerId);
            customerBalances.put(customerId, balance);
        }

        for (Map.Entry<Long, BigDecimal> entry : customerBalances.entrySet()) {
            Long customerId = entry.getKey();
            BigDecimal balance = entry.getValue();

            List<CreditTransaction> customerCredits =
                    creditTransactionRepository.findCreditTransactionsByCustomerOrderByDueDate(customerId);

            if (!customerCredits.isEmpty()) {
                CreditTransaction oldestCredit = customerCredits.get(0);
                if (oldestCredit.getDueDate() != null) {
                    long daysOverdue = ChronoUnit.DAYS.between(oldestCredit.getDueDate(), currentDate);

                    if (daysOverdue <= 0) {
                        aging.put("current", aging.get("current").add(balance));
                    } else if (daysOverdue <= 30) {
                        aging.put("days31_60", aging.get("days31_60").add(balance));
                    } else if (daysOverdue <= 60) {
                        aging.put("days61_90", aging.get("days61_90").add(balance));
                    } else {
                        aging.put("over90", aging.get("over90").add(balance));
                    }
                }
            }
        }

        Map<String, Object> report = new HashMap<>();
        report.put("aging", aging);
        report.put("totalOutstanding", aging.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add));
        report.put("currentDate", currentDate);

        return report;
    }

    public List<CreditTransaction> getOverdueCredits(Long customerId) {
        Long companyId = tenantService.requireCompanyId();
        customerRepository.findByIdAndCompany_Id(customerId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        return creditTransactionRepository.findOverdueCredits(customerId, LocalDate.now());
    }

    public List<CreditTransaction> getAllOverdueCredits() {
        Long companyId = tenantService.requireCompanyId();
        return creditTransactionRepository.findAllOverdueCreditsForCompany(companyId, LocalDate.now());
    }
}
