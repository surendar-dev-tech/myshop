package com.myshop.dto;

import com.myshop.entity.Sale;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleDto {
    private Long id;
    private String invoiceNumber;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private Long userId;
    private String userName;
    private BigDecimal totalAmount;
    private BigDecimal discount;
    private BigDecimal finalAmount;
    private Sale.PaymentMode paymentMode;
    private Boolean isCredit;
    private LocalDateTime createdAt;
    /** Sum of SALE_PAYMENT rows for this sale (credit sales: partial payment at checkout). */
    private BigDecimal partialPaymentAmount;
    private List<SaleItemDto> items;
    
    /** Shop state code from profile — for GST invoice labelling (intra-state CGST/SGST). */
    private String shopGstStateCode;

    /** Totals from line GST breakdown (GST-inclusive amounts assumed). */
    private BigDecimal totalTaxableAmount;
    private BigDecimal totalCgst;
    private BigDecimal totalSgst;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private String productUnit;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal totalPrice;
        private String hsnCode;
        private BigDecimal gstRatePercent;
        private BigDecimal taxableValue;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
    }
}









