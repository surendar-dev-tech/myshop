import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApiResponse } from '../core/models/auth.model';
import { AnalyticsService } from '../core/services/analytics.service';
import { CustomerOrderService } from '../core/services/customer-order.service';

interface TopProductRow {
  id: number;
  name: string;
  currentStock?: number;
  sellingPrice?: number;
}

interface TopCustomerRow {
  id: number;
  name: string;
  phone?: string;
  totalPurchases?: number;
  totalSpent?: number;
  outstandingBalance?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  lastRefreshed: Date | null = null;

  analytics: any = {
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    todayTransactions: 0,
    totalOutstandingCredits: 0,
    lowStockCount: 0,
    totalProducts: 0,
    activeCustomers: 0
  };

  topProducts: TopProductRow[] = [];
  topCustomers: TopCustomerRow[] = [];

  unseenOnlineOrders = 0;

  salesChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Daily sales (₹)',
      borderColor: '#0d9488',
      backgroundColor: 'rgba(13, 148, 136, 0.12)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5
    }]
  };

  salesChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { font: { family: 'Plus Jakarta Sans' } }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 0 }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(15, 23, 42, 0.06)' },
        ticks: {
          callback: function(value) {
            return '₹' + value;
          }
        }
      }
    }
  };

  constructor(
    private analyticsService: AnalyticsService,
    private customerOrderService: CustomerOrderService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    forkJoin({
      analytics: this.analyticsService.getDashboardAnalytics(),
      trend: this.analyticsService.getSalesTrend(30),
      topProducts: this.analyticsService.getTopProducts(8),
      topCustomers: this.analyticsService.getTopCustomers(8),
      unseenOrders: this.customerOrderService.getUnseenCount().pipe(
        catchError(() => of({ success: false, message: '', data: 0 } as ApiResponse<number>))
      )
    })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.lastRefreshed = new Date();
      }))
      .subscribe({
        next: ({ analytics, trend, topProducts, topCustomers, unseenOrders }) => {
          if (analytics.success && analytics.data) {
            const d = analytics.data;
            this.analytics = {
              todaySales: d.todaySales ?? 0,
              weekSales: d.weekSales ?? 0,
              monthSales: d.monthSales ?? 0,
              todayTransactions: d.todayTransactions ?? 0,
              totalOutstandingCredits: d.totalOutstandingCredits ?? 0,
              lowStockCount: d.lowStockCount ?? 0,
              totalProducts: d.totalProducts ?? 0,
              activeCustomers: d.activeCustomers ?? 0
            };
          }

          if (trend.success && trend.data?.dailySales) {
            const dailySales: { [key: string]: number } = trend.data.dailySales;
            const sortedDates = Object.keys(dailySales).sort();
            this.salesChartData = {
              ...this.salesChartData,
              labels: sortedDates as any,
              datasets: [{
                ...this.salesChartData.datasets![0],
                data: sortedDates.map((date) => dailySales[date] || 0) as number[]
              }]
            };
          }

          if (topProducts.success && topProducts.data?.products) {
            this.topProducts = topProducts.data.products as TopProductRow[];
          } else {
            this.topProducts = [];
          }

          if (topCustomers.success && topCustomers.data?.customers) {
            const list = topCustomers.data.customers as TopCustomerRow[];
            this.topCustomers = [...list]
              .sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0))
              .slice(0, 6);
          } else {
            this.topCustomers = [];
          }

          if (unseenOrders.success && unseenOrders.data != null) {
            this.unseenOnlineOrders = unseenOrders.data;
          }
        },
        error: (err) => {
          console.error('Dashboard load error:', err);
        }
      });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
