package com.myshop.service;

import com.myshop.dto.CustomerOrderDto;
import com.myshop.dto.PlaceCustomerOrderRequest;
import com.myshop.dto.SaleDto;
import com.myshop.dto.SaleRequest;
import com.myshop.entity.*;
import com.myshop.exception.BadRequestException;
import com.myshop.exception.ResourceNotFoundException;
import com.myshop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerOrderService {

    @Autowired
    private CustomerOrderRepository customerOrderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private TenantService tenantService;

    @Autowired
    private CreditService creditService;

    @Autowired
    private SaleService saleService;

    public CustomerOrderDto placeOrder(PlaceCustomerOrderRequest request) {
        Long companyId = tenantService.requireCompanyId();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user =
                userRepository
                        .findByUsername(auth.getName())
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != User.Role.CUSTOMER) {
            throw new BadRequestException("Only customer accounts can place online orders");
        }
        if (user.getCustomerProfile() == null) {
            throw new BadRequestException("Customer profile is missing");
        }

        Customer customer = user.getCustomerProfile();
        if (!customer.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Invalid shop context");
        }

        Sale.PaymentMode mode = request.getPaymentMode();
        if (mode != Sale.PaymentMode.CASH && mode != Sale.PaymentMode.CREDIT) {
            throw new BadRequestException("Online orders support CASH or CREDIT only");
        }

        boolean isCredit = mode == Sale.PaymentMode.CREDIT;
        if (isCredit) {
            validateCreditForAmount(companyId, customer, request.getDiscount(), request.getItems());
        }

        List<CustomerOrderItem> lines = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PlaceCustomerOrderRequest.LineItem line : request.getItems()) {
            Product product =
                    productRepository
                            .findByIdAndCompany_Id(line.getProductId(), companyId)
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + line.getProductId()));
            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new BadRequestException("Product is not available: " + product.getName());
            }
            if (line.getQuantity() == null || line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Invalid quantity for " + product.getName());
            }

            BigDecimal unitPrice =
                    product.getSellingPrice() != null
                            ? product.getSellingPrice().setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
            BigDecimal lineTotal = line.getQuantity().multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(lineTotal);

            CustomerOrderItem item = new CustomerOrderItem();
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setQuantity(line.getQuantity());
            item.setUnitPrice(unitPrice);
            item.setLineTotal(lineTotal);
            lines.add(item);
        }

        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Discount cannot be negative");
        }
        if (discount.compareTo(totalAmount) > 0) {
            throw new BadRequestException("Discount cannot exceed order total");
        }

        BigDecimal finalAmount = totalAmount.subtract(discount);

        CustomerOrder order = new CustomerOrder();
        order.setCompany(companyRepository.getReferenceById(companyId));
        order.setPlacedBy(user);
        order.setCustomer(customer);
        order.setOrderNumber(generateOrderNumber(companyId));
        order.setPaymentMode(mode);
        order.setStatus(CustomerOrder.CustomerOrderStatus.PENDING);
        order.setTotalAmount(totalAmount);
        order.setDiscount(discount);
        order.setFinalAmount(finalAmount);
        order.setSeenByCompany(false);

        for (CustomerOrderItem item : lines) {
            item.setCustomerOrder(order);
            order.getItems().add(item);
        }

        CustomerOrder saved = customerOrderRepository.save(order);
        return toDto(saved);
    }

    private void validateCreditForAmount(
            Long companyId,
            Customer customer,
            BigDecimal discount,
            List<PlaceCustomerOrderRequest.LineItem> items) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (PlaceCustomerOrderRequest.LineItem line : items) {
            Product product =
                    productRepository
                            .findByIdAndCompany_Id(line.getProductId(), companyId)
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            BigDecimal unitPrice =
                    product.getSellingPrice() != null
                            ? product.getSellingPrice().setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
            totalAmount =
                    totalAmount.add(line.getQuantity().multiply(unitPrice).setScale(2, RoundingMode.HALF_UP));
        }
        BigDecimal disc = discount != null ? discount : BigDecimal.ZERO;
        BigDecimal saleAmount = totalAmount.subtract(disc);
        BigDecimal currentOutstanding = creditService.getOutstandingBalance(customer.getId());
        BigDecimal creditLimit = customer.getCreditLimit() != null ? customer.getCreditLimit() : BigDecimal.ZERO;
        if (creditLimit.compareTo(BigDecimal.ZERO) > 0) {
            if (currentOutstanding.add(saleAmount).compareTo(creditLimit) > 0) {
                throw new BadRequestException(
                        "Credit limit exceeded. Current outstanding: "
                                + currentOutstanding
                                + ", Credit limit: "
                                + creditLimit
                                + ", Order amount: "
                                + saleAmount);
            }
        }
    }

    public long countUnseen() {
        Long companyId = tenantService.requireCompanyId();
        return customerOrderRepository.countByCompany_IdAndSeenByCompanyFalse(companyId);
    }

    public List<CustomerOrderDto> listOrdersForCompany() {
        Long companyId = tenantService.requireCompanyId();
        return customerOrderRepository.findByCompany_IdOrderByCreatedAtDesc(companyId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public CustomerOrderDto getById(Long id) {
        Long companyId = tenantService.requireCompanyId();
        CustomerOrder order =
                customerOrderRepository
                        .findByIdAndCompany_IdWithItems(id, companyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return toDto(order);
    }

    public void markSeen(Long id) {
        Long companyId = tenantService.requireCompanyId();
        CustomerOrder order =
                customerOrderRepository
                        .findByIdAndCompany_Id(id, companyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setSeenByCompany(true);
    }

    public SaleDto convertCustomerOrderToSale(Long customerOrderId) {
        Long companyId = tenantService.requireCompanyId();
        CustomerOrder order =
                customerOrderRepository
                        .findByIdAndCompany_IdWithItems(customerOrderId, companyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != CustomerOrder.CustomerOrderStatus.PENDING) {
            throw new BadRequestException("Order is not pending");
        }
        if (order.getConvertedSaleId() != null) {
            throw new BadRequestException("Order was already converted to a sale");
        }

        SaleRequest saleRequest = new SaleRequest();
        saleRequest.setCustomerId(order.getCustomer().getId());
        saleRequest.setDiscount(order.getDiscount());
        saleRequest.setPaymentMode(order.getPaymentMode());
        saleRequest.setIsCredit(order.getPaymentMode() == Sale.PaymentMode.CREDIT);

        List<SaleRequest.SaleItemRequest> saleItems = new ArrayList<>();
        for (CustomerOrderItem line : order.getItems()) {
            SaleRequest.SaleItemRequest si = new SaleRequest.SaleItemRequest();
            si.setProductId(line.getProduct().getId());
            si.setQuantity(line.getQuantity());
            si.setDiscount(BigDecimal.ZERO);
            si.setUnitPrice(line.getUnitPrice());
            saleItems.add(si);
        }
        saleRequest.setItems(saleItems);

        Sale sale = saleService.createSale(saleRequest);
        order.setConvertedSaleId(sale.getId());
        order.setStatus(CustomerOrder.CustomerOrderStatus.CONFIRMED);
        order.setSeenByCompany(true);
        customerOrderRepository.save(order);

        return saleService.convertToDto(sale);
    }

    private CustomerOrderDto toDto(CustomerOrder o) {
        CustomerOrderDto dto = new CustomerOrderDto();
        dto.setId(o.getId());
        dto.setOrderNumber(o.getOrderNumber());
        dto.setPaymentMode(o.getPaymentMode());
        dto.setStatus(o.getStatus());
        dto.setTotalAmount(o.getTotalAmount());
        dto.setDiscount(o.getDiscount());
        dto.setFinalAmount(o.getFinalAmount());
        dto.setSeenByCompany(o.getSeenByCompany());
        dto.setConvertedSaleId(o.getConvertedSaleId());
        if (o.getCustomer() != null) {
            dto.setCustomerId(o.getCustomer().getId());
            dto.setCustomerName(o.getCustomer().getName());
        }
        if (o.getPlacedBy() != null) {
            dto.setPlacedByUsername(o.getPlacedBy().getUsername());
        }
        dto.setCreatedAt(o.getCreatedAt());
        if (o.getItems() != null) {
            dto.setItems(
                    o.getItems().stream()
                            .map(
                                    it -> {
                                        CustomerOrderDto.CustomerOrderItemDto id = new CustomerOrderDto.CustomerOrderItemDto();
                                        id.setId(it.getId());
                                        if (it.getProduct() != null) {
                                            id.setProductId(it.getProduct().getId());
                                        }
                                        id.setProductName(it.getProductName());
                                        id.setQuantity(it.getQuantity());
                                        id.setUnitPrice(it.getUnitPrice());
                                        id.setLineTotal(it.getLineTotal());
                                        return id;
                                    })
                            .collect(Collectors.toList()));
        }
        return dto;
    }

    private String generateOrderNumber(Long companyId) {
        String candidate;
        int attempts = 0;
        do {
            candidate =
                    "ORD-"
                            + companyId
                            + "-"
                            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
                            + "-"
                            + (int) (Math.random() * 100000);
            attempts++;
        } while (customerOrderRepository.existsByCompany_IdAndOrderNumber(companyId, candidate) && attempts < 50);
        return candidate;
    }
}
