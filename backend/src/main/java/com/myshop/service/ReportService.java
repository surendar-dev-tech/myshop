package com.myshop.service;

import com.myshop.entity.Purchase;
import com.myshop.entity.Sale;
import com.myshop.entity.SaleItem;
import com.myshop.repository.PurchaseRepository;
import com.myshop.repository.SaleRepository;
import com.myshop.repository.SaleItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private TenantService tenantService;

    public Map<String, Object> getDailySalesReport(LocalDateTime date) {
        Long companyId = tenantService.requireCompanyId();
        LocalDateTime startOfDay = date.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = date.withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        List<Sale> sales = saleRepository.findSalesByDateRangeForCompany(companyId, startOfDay, endOfDay);
        Double totalSales = saleRepository.getTotalSalesByDateRangeForCompany(companyId, startOfDay, endOfDay);

        Map<String, Object> report = new HashMap<>();
        report.put("date", date.toLocalDate());
        report.put("totalSales", totalSales != null ? totalSales : 0.0);
        report.put("totalTransactions", sales.size());
        report.put("sales", sales);

        return report;
    }

    public Map<String, Object> getMonthlySalesReport(int year, int month) {
        Long companyId = tenantService.requireCompanyId();
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusSeconds(1);

        List<Sale> sales = saleRepository.findSalesByDateRangeForCompany(companyId, startOfMonth, endOfMonth);
        Double totalSales = saleRepository.getTotalSalesByDateRangeForCompany(companyId, startOfMonth, endOfMonth);

        Map<String, Object> report = new HashMap<>();
        report.put("year", year);
        report.put("month", month);
        report.put("totalSales", totalSales != null ? totalSales : 0.0);
        report.put("totalTransactions", sales.size());
        report.put("sales", sales);

        return report;
    }

    public Map<String, Object> getSalesReportByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        Long companyId = tenantService.requireCompanyId();
        List<Sale> sales = saleRepository.findSalesByDateRangeForCompany(companyId, startDate, endDate);
        Double totalSales = saleRepository.getTotalSalesByDateRangeForCompany(companyId, startDate, endDate);

        List<Map<String, Object>> salesList =
                sales.stream()
                        .map(
                                sale -> {
                                    Map<String, Object> saleMap = new HashMap<>();
                                    saleMap.put("id", sale.getId());
                                    saleMap.put("invoiceNumber", sale.getInvoiceNumber());
                                    saleMap.put("totalAmount", sale.getTotalAmount());
                                    saleMap.put("discount", sale.getDiscount());
                                    saleMap.put("finalAmount", sale.getFinalAmount());
                                    saleMap.put("paymentMode", sale.getPaymentMode().toString());
                                    saleMap.put("isCredit", sale.getIsCredit());
                                    saleMap.put("createdAt", sale.getCreatedAt());
                                    saleMap.put(
                                            "customerName",
                                            sale.getCustomer() != null ? sale.getCustomer().getName() : "Walk-in Customer");
                                    saleMap.put("customerId", sale.getCustomer() != null ? sale.getCustomer().getId() : null);
                                    return saleMap;
                                })
                        .collect(Collectors.toList());

        double cashSalesTotal = 0.0;
        double creditSalesTotal = 0.0;
        int cashTransactionCount = 0;
        int creditTransactionCount = 0;
        for (Sale s : sales) {
            double amt = s.getFinalAmount() != null ? s.getFinalAmount().doubleValue() : 0.0;
            if (Boolean.TRUE.equals(s.getIsCredit())) {
                creditSalesTotal += amt;
                creditTransactionCount++;
            } else {
                cashSalesTotal += amt;
                cashTransactionCount++;
            }
        }

        Map<String, Object> report = new HashMap<>();
        report.put("startDate", startDate.toString());
        report.put("endDate", endDate.toString());
        report.put("totalSales", totalSales != null ? totalSales : 0.0);
        report.put("totalTransactions", sales.size());
        report.put("sales", salesList);
        report.put("cashSalesTotal", cashSalesTotal);
        report.put("creditSalesTotal", creditSalesTotal);
        report.put("cashTransactionCount", cashTransactionCount);
        report.put("creditTransactionCount", creditTransactionCount);

        return report;
    }

    public Map<String, Object> getCustomerWiseSalesReport(Long customerId, LocalDateTime startDate, LocalDateTime endDate) {
        Long companyId = tenantService.requireCompanyId();
        List<Sale> allSales = saleRepository.findSalesByDateRangeForCompany(companyId, startDate, endDate);
        List<Sale> customerSales =
                allSales.stream()
                        .filter(sale -> sale.getCustomer() != null && sale.getCustomer().getId().equals(customerId))
                        .collect(Collectors.toList());

        Double totalSales =
                customerSales.stream().mapToDouble(sale -> sale.getFinalAmount().doubleValue()).sum();

        List<Map<String, Object>> salesList =
                customerSales.stream()
                        .map(
                                sale -> {
                                    Map<String, Object> saleMap = new HashMap<>();
                                    saleMap.put("id", sale.getId());
                                    saleMap.put("invoiceNumber", sale.getInvoiceNumber());
                                    saleMap.put("totalAmount", sale.getTotalAmount());
                                    saleMap.put("discount", sale.getDiscount());
                                    saleMap.put("finalAmount", sale.getFinalAmount());
                                    saleMap.put("paymentMode", sale.getPaymentMode().toString());
                                    saleMap.put("isCredit", sale.getIsCredit());
                                    saleMap.put("createdAt", sale.getCreatedAt());
                                    saleMap.put(
                                            "customerName",
                                            sale.getCustomer() != null ? sale.getCustomer().getName() : "Walk-in Customer");
                                    saleMap.put("customerId", sale.getCustomer() != null ? sale.getCustomer().getId() : null);
                                    return saleMap;
                                })
                        .collect(Collectors.toList());

        String customerName =
                customerSales.isEmpty()
                        ? "Unknown"
                        : customerSales.get(0).getCustomer() != null
                                ? customerSales.get(0).getCustomer().getName()
                                : "Unknown";

        Map<String, Object> report = new HashMap<>();
        report.put("customerId", customerId);
        report.put("customerName", customerName);
        report.put("startDate", startDate.toString());
        report.put("endDate", endDate.toString());
        report.put("totalSales", totalSales);
        report.put("totalTransactions", customerSales.size());
        report.put("sales", salesList);

        return report;
    }

    public Map<String, Object> getProductWiseSalesReport(Long productId, LocalDateTime startDate, LocalDateTime endDate) {
        Long companyId = tenantService.requireCompanyId();
        List<Sale> sales = saleRepository.findSalesByDateRangeForCompany(companyId, startDate, endDate);

        Map<String, Object> productStats = new HashMap<>();
        double totalQuantity = 0;
        double totalRevenue = 0;
        int transactionCount = 0;
        String productName = "Unknown";

        for (Sale sale : sales) {
            if (sale.getItems() != null) {
                for (var item : sale.getItems()) {
                    if (item.getProduct() != null && item.getProduct().getId().equals(productId)) {
                        totalQuantity += item.getQuantity().doubleValue();
                        totalRevenue += item.getTotalPrice().doubleValue();
                        transactionCount++;
                        if ("Unknown".equals(productName)) {
                            productName = item.getProduct().getName();
                        }
                    }
                }
            }
        }

        productStats.put("productId", productId);
        productStats.put("productName", productName);
        productStats.put("startDate", startDate.toString());
        productStats.put("endDate", endDate.toString());
        productStats.put("totalQuantity", totalQuantity);
        productStats.put("totalRevenue", totalRevenue);
        productStats.put("transactionCount", transactionCount);

        return productStats;
    }

    public Map<String, Object> getAllProductsSalesSummary(LocalDateTime startDate, LocalDateTime endDate) {
        Long companyId = tenantService.requireCompanyId();
        List<Sale> sales = saleRepository.findSalesByDateRangeForCompany(companyId, startDate, endDate);
        Map<Long, Map<String, Object>> acc = new LinkedHashMap<>();
        for (Sale sale : sales) {
            if (sale.getItems() == null) {
                continue;
            }
            for (SaleItem item : sale.getItems()) {
                if (item.getProduct() == null) {
                    continue;
                }
                Long pid = item.getProduct().getId();
                Map<String, Object> row =
                        acc.computeIfAbsent(
                                pid,
                                k -> {
                                    Map<String, Object> m = new HashMap<>();
                                    m.put("productId", pid);
                                    m.put("productName", item.getProduct().getName());
                                    m.put("totalQuantity", 0.0);
                                    m.put("totalRevenue", 0.0);
                                    m.put("lineCount", 0);
                                    return m;
                                });
                row.put("totalQuantity", (Double) row.get("totalQuantity") + item.getQuantity().doubleValue());
                row.put("totalRevenue", (Double) row.get("totalRevenue") + item.getTotalPrice().doubleValue());
                row.put("lineCount", (Integer) row.get("lineCount") + 1);
            }
        }
        List<Map<String, Object>> rows = new ArrayList<>(acc.values());
        rows.sort(Comparator.comparingDouble((Map<String, Object> m) -> (Double) m.get("totalRevenue")).reversed());
        Map<String, Object> out = new HashMap<>();
        out.put("rows", rows);
        out.put("startDate", startDate.toString());
        out.put("endDate", endDate.toString());
        return out;
    }

    public Map<String, Object> getAllCustomersSalesSummary(LocalDateTime startDate, LocalDateTime endDate) {
        Long companyId = tenantService.requireCompanyId();
        List<Sale> sales = saleRepository.findSalesByDateRangeForCompany(companyId, startDate, endDate);
        Map<Long, Map<String, Object>> acc = new LinkedHashMap<>();
        for (Sale sale : sales) {
            if (sale.getCustomer() == null) {
                continue;
            }
            Long cid = sale.getCustomer().getId();
            Map<String, Object> row =
                    acc.computeIfAbsent(
                            cid,
                            k -> {
                                Map<String, Object> m = new HashMap<>();
                                m.put("customerId", cid);
                                m.put("customerName", sale.getCustomer().getName());
                                m.put("totalSales", 0.0);
                                m.put("transactionCount", 0);
                                return m;
                            });
            row.put("totalSales", (Double) row.get("totalSales") + sale.getFinalAmount().doubleValue());
            row.put("transactionCount", (Integer) row.get("transactionCount") + 1);
        }
        List<Map<String, Object>> rows = new ArrayList<>(acc.values());
        rows.sort(Comparator.comparingDouble((Map<String, Object> m) -> (Double) m.get("totalSales")).reversed());
        Map<String, Object> out = new HashMap<>();
        out.put("rows", rows);
        out.put("startDate", startDate.toString());
        out.put("endDate", endDate.toString());
        return out;
    }

    public Map<String, Object> getSupplierWisePurchaseReport(Long supplierId, LocalDateTime startDate, LocalDateTime endDate) {
        Long companyId = tenantService.requireCompanyId();
        List<Purchase> purchases = purchaseRepository.findPurchasesByDateRangeForCompany(companyId, startDate, endDate);
        Map<Long, Map<String, Object>> acc = new LinkedHashMap<>();
        for (Purchase p : purchases) {
            if (p.getSupplier() == null) {
                continue;
            }
            if (supplierId != null && !p.getSupplier().getId().equals(supplierId)) {
                continue;
            }
            Long sid = p.getSupplier().getId();
            Map<String, Object> row =
                    acc.computeIfAbsent(
                            sid,
                            k -> {
                                Map<String, Object> m = new HashMap<>();
                                m.put("supplierId", sid);
                                m.put("supplierName", p.getSupplier().getName());
                                m.put("totalPurchaseAmount", 0.0);
                                m.put("transactionCount", 0);
                                return m;
                            });
            row.put("totalPurchaseAmount", (Double) row.get("totalPurchaseAmount") + p.getFinalAmount().doubleValue());
            row.put("transactionCount", (Integer) row.get("transactionCount") + 1);
        }
        List<Map<String, Object>> rows = new ArrayList<>(acc.values());
        rows.sort(Comparator.comparingDouble((Map<String, Object> m) -> (Double) m.get("totalPurchaseAmount")).reversed());
        Map<String, Object> out = new HashMap<>();
        out.put("rows", rows);
        out.put("supplierIdFilter", supplierId);
        out.put("startDate", startDate.toString());
        out.put("endDate", endDate.toString());
        return out;
    }
}
