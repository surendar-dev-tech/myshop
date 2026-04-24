package com.myshop.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Helpers for GST-inclusive line amounts (typical retail POS). Assumes intra-state CGST+SGST split
 * when {@link #splitCgstSgst} is used; use IGST for inter-state at call site if needed.
 */
public final class GstInvoiceUtil {

    private GstInvoiceUtil() {}

    public static BigDecimal taxableFromInclusive(BigDecimal inclusiveTotal, BigDecimal ratePercent) {
        if (inclusiveTotal == null) {
            return BigDecimal.ZERO;
        }
        if (ratePercent == null || ratePercent.compareTo(BigDecimal.ZERO) <= 0) {
            return inclusiveTotal.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal divisor =
                BigDecimal.ONE.add(ratePercent.divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP));
        return inclusiveTotal.divide(divisor, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal gstFromInclusive(BigDecimal inclusiveTotal, BigDecimal ratePercent) {
        if (inclusiveTotal == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal taxable = taxableFromInclusive(inclusiveTotal, ratePercent);
        return inclusiveTotal.subtract(taxable).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal half(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        return amount.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
    }
}
