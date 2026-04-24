package com.myshop.dto;

import com.myshop.entity.CustomerOrder;
import com.myshop.entity.Sale;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CustomerOrderDto {

    private Long id;
    private String orderNumber;
    private Sale.PaymentMode paymentMode;
    private CustomerOrder.CustomerOrderStatus status;
    private BigDecimal totalAmount;
    private BigDecimal discount;
    private BigDecimal finalAmount;
    private Boolean seenByCompany;
    private Long convertedSaleId;
    private Long customerId;
    private String customerName;
    private String placedByUsername;
    private LocalDateTime createdAt;
    private List<CustomerOrderItemDto> items;

    @Data
    public static class CustomerOrderItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
