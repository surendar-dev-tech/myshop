package com.myshop.dto;

import com.myshop.entity.Sale;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PlaceCustomerOrderRequest {

    @NotEmpty
    @Valid
    private List<LineItem> items;

    @NotNull
    private BigDecimal discount = BigDecimal.ZERO;

    /** Online orders: CASH or CREDIT only */
    @NotNull
    private Sale.PaymentMode paymentMode;

    @Data
    public static class LineItem {
        @NotNull
        private Long productId;

        @NotNull
        private BigDecimal quantity;
    }
}
