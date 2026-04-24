package com.myshop.service;

import com.myshop.dto.SaleDto;
import com.myshop.dto.SaleRequest;
import com.myshop.entity.*;
import com.myshop.exception.BadRequestException;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.*;
import com.myshop.util.GstInvoiceUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Transactional
public class SaleService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private StockRepository stockRepository;

 
    @Autowired
    private CreditTransactionRepository creditTransactionRepository;

    @Autowired
    private CreditService creditService;

    @Autowired
    private TenantService tenantService;

    @Autowired
    private ShopProfileRepository shopProfileRepository;

    @Autowired
    private CustomerOrderRepository customerOrderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public Sale createSale(SaleRequest saleRequest) {
        Long companyId = tenantService.requireCompanyId();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Customer customer = null;
        if (saleRequest.getCustomerId() != null) {
            customer = customerRepository.findByIdAndCompany_Id(saleRequest.getCustomerId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Sale sale = new Sale();
        sale.setCompany(companyRepository.getReferenceById(companyId));
        sale.setInvoiceNumber(generateInvoiceNumber(companyId));
        sale.setCustomer(customer);
        sale.setUser(user);
        sale.setDiscount(saleRequest.getDiscount());
        sale.setPaymentMode(saleRequest.getPaymentMode());
        sale.setIsCredit(saleRequest.getIsCredit() || saleRequest.getPaymentMode() == Sale.PaymentMode.CREDIT);

        List<SaleItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SaleRequest.SaleItemRequest itemRequest : saleRequest.getItems()) {
            Product product = productRepository.findByIdAndCompany_Id(itemRequest.getProductId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemRequest.getProductId()));

            BigDecimal currentStock = stockRepository.getCurrentStock(product.getId());
            boolean isNegativeStock = currentStock.compareTo(itemRequest.getQuantity()) < 0;
            String stockNote = isNegativeStock
                    ? "Sale - Invoice: " + sale.getInvoiceNumber() + " (WARNING: Negative stock - Available: " + currentStock + ")"
                    : "Sale - Invoice: " + sale.getInvoiceNumber();

            BigDecimal unitPrice = resolveUnitPrice(itemRequest.getUnitPrice(), product.getSellingPrice());

            SaleItem item = new SaleItem();
            item.setSale(sale);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(unitPrice);
            item.setDiscount(itemRequest.getDiscount());

            BigDecimal itemTotal = itemRequest.getQuantity()
                    .multiply(unitPrice)
                    .subtract(itemRequest.getDiscount());
            item.setTotalPrice(itemTotal);
            item.setHsnCode(product.getHsnCode());
            item.setGstRatePercent(product.getGstRatePercent());

            items.add(item);
            totalAmount = totalAmount.add(itemTotal);

            Stock stock = new Stock();
            stock.setProduct(product);
            stock.setQuantity(itemRequest.getQuantity());
            stock.setTransactionType(Stock.TransactionType.STOCK_OUT);
            stock.setNotes(stockNote);
            stock.setUser(user);
            stockRepository.save(stock);
        }

        sale.setTotalAmount(totalAmount);
        sale.setFinalAmount(totalAmount.subtract(saleRequest.getDiscount()));
        sale.setItems(items);

        boolean isCreditSale = saleRequest.getIsCredit() || saleRequest.getPaymentMode() == Sale.PaymentMode.CREDIT;
        sale.setIsCredit(isCreditSale);

        Sale savedSale = saleRepository.save(sale);

        if (!isCreditSale) {
            Payment payment = new Payment();
            payment.setSale(savedSale);
            payment.setAmount(savedSale.getFinalAmount());
            payment.setPaymentType(Payment.PaymentType.SALE_PAYMENT);
            payment.setUser(user);
            paymentRepository.save(payment);
        } else {
            if (customer == null) {
                throw new BadRequestException("Customer is required for credit sales");
            }

            BigDecimal currentOutstanding = creditService.getOutstandingBalance(customer.getId());
            BigDecimal saleAmount = savedSale.getFinalAmount();
            BigDecimal partialPayment =
                    saleRequest.getPartialPaymentAmount() != null ? saleRequest.getPartialPaymentAmount() : BigDecimal.ZERO;
            BigDecimal newCreditAmount = saleAmount.subtract(partialPayment);
            BigDecimal creditLimit = customer.getCreditLimit() != null ? customer.getCreditLimit() : BigDecimal.ZERO;

            if (partialPayment.compareTo(saleAmount) > 0) {
                throw new BadRequestException("Partial payment cannot exceed sale amount");
            }

            if (creditLimit.compareTo(BigDecimal.ZERO) > 0) {
                if (currentOutstanding.add(newCreditAmount).compareTo(creditLimit) > 0) {
                    throw new BadRequestException(
                            "Credit limit exceeded. Current outstanding: " + currentOutstanding
                                    + ", Credit limit: " + creditLimit + ", New credit: " + newCreditAmount);
                }
            }

            if (partialPayment.compareTo(BigDecimal.ZERO) > 0) {
                Payment payment = new Payment();
                payment.setSale(savedSale);
                payment.setCustomer(customer);
                payment.setAmount(partialPayment);
                payment.setPaymentType(Payment.PaymentType.SALE_PAYMENT);
                payment.setNotes("Partial payment - Invoice: " + savedSale.getInvoiceNumber());
                payment.setUser(user);
                paymentRepository.save(payment);
            }

            if (newCreditAmount.compareTo(BigDecimal.ZERO) > 0) {
                CreditTransaction creditTransaction = new CreditTransaction();
                creditTransaction.setCustomer(customer);
                creditTransaction.setSale(savedSale);
                creditTransaction.setAmount(newCreditAmount);
                creditTransaction.setTransactionType(CreditTransaction.TransactionType.CREDIT_ADDED);
                creditTransaction.setNotes(
                        "Credit sale - Invoice: " + savedSale.getInvoiceNumber()
                                + (partialPayment.compareTo(BigDecimal.ZERO) > 0
                                        ? " (Partial payment: " + partialPayment + ")"
                                        : ""));
                creditTransaction.setUser(user);

                Integer creditDays = customer.getCreditDays() != null ? customer.getCreditDays() : 30;
                creditTransaction.setDueDate(LocalDate.now().plusDays(creditDays));

                creditTransactionRepository.save(creditTransaction);
            }

            customer.setCurrentCredit(currentOutstanding.add(newCreditAmount));
            customerRepository.save(customer);
        }

        if (saleRequest.getSourceCustomerOrderId() != null) {
            linkCustomerOrderToSale(companyId, saleRequest.getSourceCustomerOrderId(), savedSale.getId());
        }

        return savedSale;
    }

    private void linkCustomerOrderToSale(Long companyId, Long customerOrderId, Long saleId) {
        CustomerOrder order =
                customerOrderRepository
                        .findByIdAndCompany_Id(customerOrderId, companyId)
                        .orElseThrow(() -> new BadRequestException("Online order not found"));

        if (order.getStatus() != CustomerOrder.CustomerOrderStatus.PENDING) {
            throw new BadRequestException("Online order is not pending");
        }
        if (order.getConvertedSaleId() != null) {
            throw new BadRequestException("Online order was already converted");
        }

        order.setConvertedSaleId(saleId);
        order.setStatus(CustomerOrder.CustomerOrderStatus.CONFIRMED);
        order.setSeenByCompany(true);
        customerOrderRepository.save(order);
    }

    public SaleDto convertToDto(Sale sale) {
        Long companyId = tenantService.requireCompanyId();
        Optional<ShopProfile> profileOpt = shopProfileRepository.findByCompany_Id(companyId);

        SaleDto dto = new SaleDto();
        dto.setId(sale.getId());
        dto.setInvoiceNumber(sale.getInvoiceNumber());
        dto.setTotalAmount(sale.getTotalAmount());
        dto.setDiscount(sale.getDiscount());
        dto.setFinalAmount(sale.getFinalAmount());
        dto.setPaymentMode(sale.getPaymentMode());
        dto.setIsCredit(sale.getIsCredit());
        dto.setCreatedAt(sale.getCreatedAt());

        profileOpt.ifPresent(p -> dto.setShopGstStateCode(p.getGstStateCode()));

        BigDecimal sumTaxable = BigDecimal.ZERO;
        BigDecimal sumCgst = BigDecimal.ZERO;
        BigDecimal sumSgst = BigDecimal.ZERO;

        if (sale.getCustomer() != null) {
            dto.setCustomerId(sale.getCustomer().getId());
            dto.setCustomerName(sale.getCustomer().getName());
            dto.setCustomerPhone(sale.getCustomer().getPhone());
            dto.setCustomerAddress(sale.getCustomer().getAddress());
        }

        if (Boolean.TRUE.equals(sale.getIsCredit())) {
            dto.setPartialPaymentAmount(sumSalePayments(sale.getId()));
        } else {
            dto.setPartialPaymentAmount(BigDecimal.ZERO);
        }

        if (sale.getUser() != null) {
            dto.setUserId(sale.getUser().getId());
            dto.setUserName(sale.getUser().getUsername());
        }

        if (sale.getItems() != null) {
            List<SaleDto.SaleItemDto> itemDtos = new ArrayList<>();
            for (SaleItem item : sale.getItems()) {
                SaleDto.SaleItemDto itemDto = new SaleDto.SaleItemDto();
                itemDto.setId(item.getId());
                if (item.getProduct() != null) {
                    itemDto.setProductId(item.getProduct().getId());
                    itemDto.setProductName(item.getProduct().getName());
                    itemDto.setProductUnit(item.getProduct().getUnit());
                }
                itemDto.setQuantity(item.getQuantity());
                itemDto.setUnitPrice(item.getUnitPrice());
                itemDto.setDiscount(item.getDiscount());
                itemDto.setTotalPrice(item.getTotalPrice());
                itemDto.setHsnCode(item.getHsnCode());
                itemDto.setGstRatePercent(item.getGstRatePercent());

                BigDecimal lineTotal = item.getTotalPrice();
                BigDecimal rate = item.getGstRatePercent();
                if (rate != null && rate.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal taxable = GstInvoiceUtil.taxableFromInclusive(lineTotal, rate);
                    BigDecimal gst = GstInvoiceUtil.gstFromInclusive(lineTotal, rate);
                    BigDecimal half = GstInvoiceUtil.half(gst);
                    itemDto.setTaxableValue(taxable);
                    itemDto.setCgstAmount(half);
                    itemDto.setSgstAmount(half);
                    sumTaxable = sumTaxable.add(taxable);
                    sumCgst = sumCgst.add(half);
                    sumSgst = sumSgst.add(half);
                } else {
                    itemDto.setTaxableValue(lineTotal);
                    itemDto.setCgstAmount(BigDecimal.ZERO);
                    itemDto.setSgstAmount(BigDecimal.ZERO);
                    sumTaxable = sumTaxable.add(lineTotal != null ? lineTotal : BigDecimal.ZERO);
                }
                itemDtos.add(itemDto);
            }
            dto.setItems(itemDtos);
        }

        dto.setTotalTaxableAmount(sumTaxable);
        dto.setTotalCgst(sumCgst);
        dto.setTotalSgst(sumSgst);

        return dto;
    }

    private BigDecimal sumSalePayments(Long saleId) {
        List<Payment> payments = paymentRepository.findBySaleId(saleId);
        if (payments == null || payments.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return payments.stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.SALE_PAYMENT)
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<Sale> getAllSales() {
        Long companyId = tenantService.requireCompanyId();
        return saleRepository.findByCompany_IdOrderByCreatedAtDesc(companyId);
    }

    public Sale getSaleById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        return saleRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
    }

    public List<Sale> getSalesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        Long companyId = tenantService.requireCompanyId();
        return saleRepository.findSalesByDateRangeForCompany(companyId, startDate, endDate);
    }

    private BigDecimal resolveUnitPrice(BigDecimal requested, BigDecimal catalogPrice) {
        if (requested != null && requested.compareTo(BigDecimal.ZERO) > 0) {
            return requested.setScale(2, RoundingMode.HALF_UP);
        }
        return catalogPrice != null ? catalogPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    private String generateInvoiceNumber(Long companyId) {
        String candidate;
        int attempts = 0;
        do {
            candidate =
                    "INV-"
                            + companyId
                            + "-"
                            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
                            + "-"
                            + (int) (Math.random() * 100000);
            attempts++;
        } while (saleRepository.existsByCompany_IdAndInvoiceNumber(companyId, candidate) && attempts < 50);
        return candidate;
    }
}
