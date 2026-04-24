package com.myshop.service;

import com.myshop.entity.Customer;
import com.myshop.entity.Product;
import com.myshop.entity.Purchase;
import com.myshop.entity.Sale;
import com.myshop.repository.SaleRepository;
import com.myshop.repository.ProductRepository;
import com.myshop.repository.CustomerRepository;
import com.myshop.repository.StockRepository;
import com.myshop.repository.CreditTransactionRepository;
import com.myshop.repository.PurchaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private CreditTransactionRepository creditTransactionRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private TenantService tenantService;

    private static final BigDecimal LOW_STOCK_THRESHOLD = BigDecimal.valueOf(10);

    public Map<String, Object> getDashboardAnalytics() {
        Long companyId = tenantService.requireCompanyId();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(23, 59, 59);
        LocalDateTime weekStart = todayStart.minusDays(7);
        LocalDateTime monthStart = todayStart.minusMonths(1);

        Map<String, Object> analytics = new HashMap<>();

        Double todayTotal =
                saleRepository.getTotalSalesByDateRangeForCompany(companyId, todayStart, todayEnd);
        Double weekTotal =
                saleRepository.getTotalSalesByDateRangeForCompany(companyId, weekStart, todayEnd);
        Double monthTotal =
                saleRepository.getTotalSalesByDateRangeForCompany(companyId, monthStart, todayEnd);

        long todayTransactions = saleRepository.countByCompany_IdAndCreatedAtBetween(companyId, todayStart, todayEnd);

        BigDecimal totalOutstanding = BigDecimal.ZERO;
        try {
            List<Object[]> outstandingBalances = creditTransactionRepository.getAllOutstandingBalancesForCompany(companyId);
            if (outstandingBalances != null && !outstandingBalances.isEmpty()) {
                totalOutstanding =
                        outstandingBalances.stream()
                                .map(item -> item[1] != null ? (BigDecimal) item[1] : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        } catch (Exception e) {
            totalOutstanding = BigDecimal.ZERO;
        }

        List<Product> lowStockProducts = productRepository.findLowStockProducts(companyId, LOW_STOCK_THRESHOLD);

        long totalProducts = productRepository.countByCompany_Id(companyId);

        long activeCustomers = customerRepository.countByCompany_IdAndActiveTrue(companyId);

        analytics.put("todaySales", todayTotal != null ? todayTotal : 0.0);
        analytics.put("weekSales", weekTotal != null ? weekTotal : 0.0);
        analytics.put("monthSales", monthTotal != null ? monthTotal : 0.0);
        analytics.put("todayTransactions", (int) todayTransactions);
        analytics.put("totalOutstandingCredits", totalOutstanding != null ? totalOutstanding.doubleValue() : 0.0);
        analytics.put("lowStockCount", lowStockProducts != null ? lowStockProducts.size() : 0);
        analytics.put("totalProducts", totalProducts);
        analytics.put("activeCustomers", activeCustomers);

        return analytics;
    }

    public Map<String, Object> getSalesTrend(int days) {
        Long companyId = tenantService.requireCompanyId();
        LocalDateTime endDate = LocalDate.now().atTime(23, 59, 59);
        LocalDateTime startDate = endDate.minusDays(days);

        List<Object[]> rows = saleRepository.getDailySalesTotalsForCompany(companyId, startDate, endDate);
        Map<String, Double> dailySales = new HashMap<>();
        for (Object[] row : rows) {
            String dayKey = toLocalDateString(row[0]);
            BigDecimal sum =
                    row[1] instanceof BigDecimal
                            ? (BigDecimal) row[1]
                            : BigDecimal.valueOf(((Number) row[1]).doubleValue());
            dailySales.put(dayKey, sum.doubleValue());
        }

        Map<String, Object> trend = new HashMap<>();
        trend.put("dailySales", dailySales);
        trend.put("totalSales", dailySales.values().stream().mapToDouble(Double::doubleValue).sum());
        trend.put("averageDaily", dailySales.values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0));

        return trend;
    }

    private static String toLocalDateString(Object dateCell) {
        if (dateCell == null) {
            return "";
        }
        if (dateCell instanceof java.sql.Date) {
            return ((java.sql.Date) dateCell).toLocalDate().toString();
        }
        if (dateCell instanceof LocalDate) {
            return dateCell.toString();
        }
        if (dateCell instanceof java.util.Date) {
            return new java.sql.Date(((java.util.Date) dateCell).getTime()).toLocalDate().toString();
        }
        return dateCell.toString();
    }

    public Map<String, Object> getTopProducts(int limit) {
        Long companyId = tenantService.requireCompanyId();
        Map<Long, BigDecimal> stockMap =
                stockRepository.getProductStockTotalsByCompany(companyId).stream()
                        .collect(Collectors.toMap(row -> (Long) row[0], row -> (BigDecimal) row[1], (a, b) -> b));

        List<Product> products = productRepository.findByCompany_Id(companyId);
        List<Map<String, Object>> topProducts =
                products.stream()
                        .sorted(Comparator.comparing((Product p) -> stockMap.getOrDefault(p.getId(), BigDecimal.ZERO)).reversed())
                        .limit(limit)
                        .map(
                                product -> {
                                    Map<String, Object> productData = new HashMap<>();
                                    productData.put("id", product.getId());
                                    productData.put("name", product.getName());
                                    productData.put("currentStock", stockMap.getOrDefault(product.getId(), BigDecimal.ZERO));
                                    productData.put("sellingPrice", product.getSellingPrice());
                                    return productData;
                                })
                        .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("products", topProducts);
        return result;
    }

    public Map<String, Object> getTopCustomers(int limit) {
        Long companyId = tenantService.requireCompanyId();
        List<Object[]> aggregates = saleRepository.getCustomerSaleAggregatesForCompany(companyId);
        if (aggregates == null || aggregates.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("customers", List.of());
            return empty;
        }

        Map<Long, BigDecimal> outstandingMap =
                creditTransactionRepository.getOutstandingBalancesGroupedByCustomerForCompany(companyId).stream()
                        .collect(Collectors.toMap(row -> (Long) row[0], row -> (BigDecimal) row[1], (a, b) -> b));

        List<Object[]> sorted =
                aggregates.stream()
                        .sorted(
                                (a, b) -> {
                                    BigDecimal sumB = (BigDecimal) b[2];
                                    BigDecimal sumA = (BigDecimal) a[2];
                                    return sumB.compareTo(sumA);
                                })
                        .limit(limit)
                        .collect(Collectors.toList());

        Set<Long> ids = sorted.stream().map(row -> (Long) row[0]).collect(Collectors.toSet());
        Map<Long, Customer> customerById =
                customerRepository.findAllById(ids).stream().collect(Collectors.toMap(Customer::getId, c -> c));

        List<Map<String, Object>> topCustomers = new ArrayList<>();
        for (Object[] row : sorted) {
            Long id = (Long) row[0];
            long purchaseCount = ((Number) row[1]).longValue();
            BigDecimal totalSpent = (BigDecimal) row[2];
            Customer customer = customerById.get(id);
            if (customer == null) {
                continue;
            }
            Map<String, Object> customerData = new HashMap<>();
            customerData.put("id", id);
            customerData.put("name", customer.getName());
            customerData.put("phone", customer.getPhone());
            customerData.put("totalPurchases", (int) purchaseCount);
            customerData.put("totalSpent", totalSpent.doubleValue());
            customerData.put("outstandingBalance", outstandingMap.getOrDefault(id, BigDecimal.ZERO));
            topCustomers.add(customerData);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("customers", topCustomers);
        return result;
    }

    public Map<String, Object> getProfitLossReport(LocalDate startDate, LocalDate endDate) {
        Long companyId = tenantService.requireCompanyId();
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        List<Sale> sales = saleRepository.findSalesByDateRangeForCompany(companyId, startDateTime, endDateTime);

        double totalRevenue = sales.stream().mapToDouble(sale -> sale.getFinalAmount().doubleValue()).sum();

        double totalCost = 0.0;
        for (Sale sale : sales) {
            if (sale.getItems() != null) {
                for (var item : sale.getItems()) {
                    if (item.getProduct() != null) {
                        double cost = item.getProduct().getPurchasePrice().doubleValue() * item.getQuantity().doubleValue();
                        totalCost += cost;
                    }
                }
            }
        }

        double grossProfit = totalRevenue - totalCost;
        double profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        Map<String, Object> report = new HashMap<>();
        report.put("startDate", startDate.toString());
        report.put("endDate", endDate.toString());
        report.put("totalRevenue", totalRevenue);
        report.put("totalCost", totalCost);
        report.put("grossProfit", grossProfit);
        report.put("profitMargin", profitMargin);
        report.put("totalTransactions", sales.size());

        return report;
    }

    public Map<String, Object> getEnhancedProfitLossReport(LocalDate startDate, LocalDate endDate) {
        Long companyId = tenantService.requireCompanyId();
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        List<Sale> sales = saleRepository.findSalesByDateRangeForCompany(companyId, startDateTime, endDateTime);
        List<Purchase> purchases = purchaseRepository.findPurchasesByDateRangeForCompany(companyId, startDateTime, endDateTime);

        double totalRevenue = sales.stream().mapToDouble(sale -> sale.getFinalAmount().doubleValue()).sum();

        double totalCOGS = 0.0;
        for (Sale sale : sales) {
            if (sale.getItems() != null) {
                for (var item : sale.getItems()) {
                    if (item.getProduct() != null) {
                        double cost = item.getProduct().getPurchasePrice().doubleValue() * item.getQuantity().doubleValue();
                        totalCOGS += cost;
                    }
                }
            }
        }

        double totalPurchases = purchases.stream().mapToDouble(purchase -> purchase.getFinalAmount().doubleValue()).sum();

        double grossProfit = totalRevenue - totalCOGS;
        double profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        double netProfit = grossProfit - totalPurchases;
        double netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        Map<String, Object> report = new HashMap<>();
        report.put("startDate", startDate.toString());
        report.put("endDate", endDate.toString());
        report.put("totalRevenue", totalRevenue);
        report.put("totalCOGS", totalCOGS);
        report.put("totalPurchases", totalPurchases);
        report.put("grossProfit", grossProfit);
        report.put("profitMargin", profitMargin);
        report.put("netProfit", netProfit);
        report.put("netProfitMargin", netProfitMargin);
        report.put("totalSalesTransactions", sales.size());
        report.put("totalPurchaseTransactions", purchases.size());

        return report;
    }
}
