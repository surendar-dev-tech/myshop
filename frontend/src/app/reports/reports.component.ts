import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { environment } from '../../environments/environment';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SaleService } from '../core/services/sale.service';
import { saleToInvoiceData } from '../sales/invoice-from-sale';
import { InvoicePrintDialogService } from '../sales/invoice-print-dialog.service';
import { ProductService, Product } from '../core/services/product.service';
import { CustomerService, Customer } from '../core/services/customer.service';
import { SupplierService, Supplier } from '../core/services/supplier.service';
import { ApiResponse } from '../core/models/auth.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  dateRangeForm: FormGroup;
  customerReportForm: FormGroup;
  productReportForm: FormGroup;
  summaryRangeForm: FormGroup;
  supplierReportForm: FormGroup;

  dateRangeReport: any = null;
  customerReport: any = null;
  productReport: any = null;
  productSummaryReport: any = null;
  customerSummaryReport: any = null;
  supplierReport: any = null;

  dateRangeSalesDataSource = new MatTableDataSource<any>([]);
  customerSalesDataSource = new MatTableDataSource<any>([]);
  productSummaryDataSource = new MatTableDataSource<any>([]);
  customerSummaryDataSource = new MatTableDataSource<any>([]);
  supplierDataSource = new MatTableDataSource<any>([]);

  customers: Customer[] = [];
  products: Product[] = [];
  suppliers: Supplier[] = [];

  dateRangeDisplayedColumns = ['invoiceNumber', 'date', 'customer', 'total', 'paymentMode', 'credit', 'actions'];
  customerDisplayedColumns = ['invoiceNumber', 'date', 'total', 'paymentMode', 'credit', 'actions'];
  /** While fetching full sale for print */
  printLoadingId: number | null = null;
  productSummaryDisplayedColumns = ['productName', 'totalQuantity', 'totalRevenue', 'lineCount'];
  customerSummaryDisplayedColumns = ['customerName', 'totalSales', 'transactionCount'];
  supplierDisplayedColumns = ['supplierName', 'totalPurchaseAmount', 'transactionCount'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private customerService: CustomerService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private saleService: SaleService,
    private invoicePrintDialog: InvoicePrintDialogService
  ) {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    this.dateRangeForm = this.fb.group({
      startDate: [lastMonth],
      endDate: [today]
    });

    this.customerReportForm = this.fb.group({
      customerId: [null],
      startDate: [lastMonth],
      endDate: [today]
    });

    this.productReportForm = this.fb.group({
      productId: [null],
      startDate: [lastMonth],
      endDate: [today]
    });

    this.summaryRangeForm = this.fb.group({
      startDate: [lastMonth],
      endDate: [today]
    });

    this.supplierReportForm = this.fb.group({
      supplierId: [null],
      startDate: [lastMonth],
      endDate: [today]
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();
    this.loadSuppliers();
  }

  private toApiRange(startDate: unknown, endDate: unknown): { start: string; end: string } | null {
    if (!startDate || !endDate) {
      return null;
    }
    const startDateObj = startDate instanceof Date ? startDate : new Date(startDate as string);
    const endDateObj = endDate instanceof Date ? endDate : new Date(endDate as string);
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(23, 59, 59, 999);
    return { start: startDateObj.toISOString(), end: endDateObj.toISOString() };
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers = response.data;
        }
      }
    });
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products = response.data;
        }
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.suppliers = response.data;
        }
      }
    });
  }

  loadDateRangeReport(): void {
    const range = this.toApiRange(
      this.dateRangeForm.get('startDate')?.value,
      this.dateRangeForm.get('endDate')?.value
    );
    if (!range) {
      this.snackBar.open('Please select both start and end dates', 'Close', { duration: 3000 });
      return;
    }

    this.http
      .get<ApiResponse<any>>(`${environment.apiUrl}/reports/date-range`, {
        params: { startDate: range.start, endDate: range.end }
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dateRangeReport = response.data;
            this.dateRangeSalesDataSource.data = response.data.sales || [];
            if (response.data.sales?.length === 0) {
              this.snackBar.open('No sales found for the selected date range', 'Close', { duration: 3000 });
            }
          } else {
            this.snackBar.open(response.message || 'Failed to load report', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          this.snackBar.open('Error loading report: ' + errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  loadCustomerReport(): void {
    const customerId = this.customerReportForm.get('customerId')?.value;
    const range = this.toApiRange(
      this.customerReportForm.get('startDate')?.value,
      this.customerReportForm.get('endDate')?.value
    );
    if (!customerId) {
      this.snackBar.open('Please select a customer', 'Close', { duration: 3000 });
      return;
    }
    if (!range) {
      this.snackBar.open('Please select both start and end dates', 'Close', { duration: 3000 });
      return;
    }

    this.http
      .get<ApiResponse<any>>(`${environment.apiUrl}/reports/customer`, {
        params: {
          customerId: customerId.toString(),
          startDate: range.start,
          endDate: range.end
        }
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.customerReport = response.data;
            this.customerSalesDataSource.data = response.data.sales || [];
            if (response.data.sales?.length === 0) {
              this.snackBar.open('No sales for this customer in the range', 'Close', { duration: 3000 });
            }
          } else {
            this.snackBar.open(response.message || 'Failed to load report', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          this.snackBar.open('Error loading customer report: ' + errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  loadProductReport(): void {
    const productId = this.productReportForm.get('productId')?.value;
    const range = this.toApiRange(
      this.productReportForm.get('startDate')?.value,
      this.productReportForm.get('endDate')?.value
    );
    if (!productId) {
      this.snackBar.open('Please select a product', 'Close', { duration: 3000 });
      return;
    }
    if (!range) {
      this.snackBar.open('Please select both start and end dates', 'Close', { duration: 3000 });
      return;
    }

    this.http
      .get<ApiResponse<any>>(`${environment.apiUrl}/reports/product`, {
        params: {
          productId: productId.toString(),
          startDate: range.start,
          endDate: range.end
        }
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.productReport = response.data;
            if (response.data.transactionCount === 0) {
              this.snackBar.open('No sales for this product in the range', 'Close', { duration: 3000 });
            }
          } else {
            this.snackBar.open(response.message || 'Failed to load report', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          this.snackBar.open('Error loading product report: ' + errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  /** Product-wise + customer-wise aggregates for the same date range */
  loadSalesSummaries(): void {
    const range = this.toApiRange(
      this.summaryRangeForm.get('startDate')?.value,
      this.summaryRangeForm.get('endDate')?.value
    );
    if (!range) {
      this.snackBar.open('Please select both start and end dates', 'Close', { duration: 3000 });
      return;
    }

    const params = { startDate: range.start, endDate: range.end };
    forkJoin({
      products: this.http.get<ApiResponse<any>>(`${environment.apiUrl}/reports/products-summary`, { params }),
      customers: this.http.get<ApiResponse<any>>(`${environment.apiUrl}/reports/customers-summary`, { params })
    }).subscribe({
      next: ({ products, customers }) => {
        if (products.success) {
          this.productSummaryReport = products.data;
          this.productSummaryDataSource.data = products.data.rows || [];
        }
        if (customers.success) {
          this.customerSummaryReport = customers.data;
          this.customerSummaryDataSource.data = customers.data.rows || [];
        }
        if (
          (!products.data?.rows?.length && products.success) &&
          (!customers.data?.rows?.length && customers.success)
        ) {
          this.snackBar.open('No sales data in this period', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || error.message || 'Unknown error';
        this.snackBar.open('Error: ' + errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  loadSupplierReport(): void {
    const range = this.toApiRange(
      this.supplierReportForm.get('startDate')?.value,
      this.supplierReportForm.get('endDate')?.value
    );
    if (!range) {
      this.snackBar.open('Please select both start and end dates', 'Close', { duration: 3000 });
      return;
    }

    const supplierId = this.supplierReportForm.get('supplierId')?.value;
    let params = new HttpParams().set('startDate', range.start).set('endDate', range.end);
    if (supplierId != null && supplierId !== '') {
      params = params.set('supplierId', String(supplierId));
    }

    this.http.get<ApiResponse<any>>(`${environment.apiUrl}/reports/supplier-purchases`, { params }).subscribe({
      next: (response) => {
        if (response.success) {
          this.supplierReport = response.data;
          this.supplierDataSource.data = response.data.rows || [];
          if (!response.data.rows?.length) {
            this.snackBar.open('No supplier purchases in this period', 'Close', { duration: 3000 });
          }
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || error.message || 'Unknown error';
        this.snackBar.open('Error: ' + errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  /** Opens the same printable invoice dialog as POS (loads full sale lines from API). */
  printInvoiceFromRow(saleRow: { id?: number }): void {
    const id = saleRow?.id;
    if (id == null) {
      return;
    }
    this.printLoadingId = id;
    this.saleService.getSaleById(id).subscribe({
      next: (res) => {
        this.printLoadingId = null;
        if (res.success && res.data) {
          this.invoicePrintDialog.open(saleToInvoiceData(res.data));
        } else {
          this.snackBar.open('Could not load invoice', 'Close', { duration: 4000 });
        }
      },
      error: () => {
        this.printLoadingId = null;
        this.snackBar.open('Could not load invoice', 'Close', { duration: 4000 });
      }
    });
  }
}
