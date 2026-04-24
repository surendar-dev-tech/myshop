import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, Observable } from 'rxjs';
import { Customer } from '../core/services/customer.service';
import { ProductService, Product } from '../core/services/product.service';
import { CustomerProductPriceService } from '../core/services/customer-product-price.service';
import { ApiResponse } from '../core/models/auth.model';

export interface CustomerSpecialPricesDialogData {
  customer: Customer;
}

interface PriceRow {
  product: Product;
  /** Effective unit price shown in the field (defaults to catalog) */
  editedPrice: number;
  existingPriceId?: number;
}

@Component({
  selector: 'app-customer-special-prices-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './customer-special-prices-dialog.component.html',
  styleUrls: ['./customer-special-prices-dialog.component.scss']
})
export class CustomerSpecialPricesDialogComponent implements OnInit {
  customerName = '';
  rows: PriceRow[] = [];
  loading = true;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<CustomerSpecialPricesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomerSpecialPricesDialogData,
    private productService: ProductService,
    private customerProductPriceService: CustomerProductPriceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const c = this.data.customer;
    this.customerName = c.name;
    const customerId = c.id;
    if (customerId == null) {
      this.loading = false;
      return;
    }

    forkJoin({
      products: this.productService.getActiveProducts(),
      prices: this.customerProductPriceService.listByCustomer(customerId)
    }).subscribe({
      next: ({ products, prices }) => {
        const plist = products.success && products.data ? products.data : [];
        const byProduct = new Map<number, { id: number; unitPrice: number }>();
        if (prices.success && prices.data) {
          for (const p of prices.data) {
            if (p.id != null) {
              byProduct.set(p.productId, { id: p.id, unitPrice: p.unitPrice });
            }
          }
        }
        this.rows = plist
          .filter((p) => p.id != null)
          .map((product) => {
            const custom = product.id != null ? byProduct.get(product.id) : undefined;
            const catalog = Number(product.sellingPrice ?? 0);
            return {
              product,
              editedPrice: custom != null ? Number(custom.unitPrice) : catalog,
              existingPriceId: custom?.id
            };
          })
          .sort((a, b) => (a.product.name || '').localeCompare(b.product.name || ''));
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Could not load products or prices', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  catalogPrice(row: PriceRow): number {
    return Number(row.product.sellingPrice ?? 0);
  }

  isCustom(row: PriceRow): boolean {
    const cat = this.catalogPrice(row);
    return Math.abs(row.editedPrice - cat) > 0.0001;
  }

  save(): void {
    const customerId = this.data.customer.id;
    if (customerId == null) {
      return;
    }
    this.saving = true;
    const requests: Array<Observable<ApiResponse<unknown>>> = [];

    for (const row of this.rows) {
      const pid = row.product.id;
      if (pid == null) {
        continue;
      }
      if (this.isCustom(row)) {
        requests.push(
          this.customerProductPriceService.upsert({
            customerId,
            productId: pid,
            unitPrice: row.editedPrice
          })
        );
      } else if (row.existingPriceId != null) {
        requests.push(
          this.customerProductPriceService.deleteByCustomerAndProduct(customerId, pid)
        );
      }
    }

    if (requests.length === 0) {
      this.saving = false;
      this.snackBar.open('No changes to save', 'Close', { duration: 2500 });
      return;
    }

    forkJoin(requests).subscribe({
      next: (results) => {
        const failed = results.some((r) => !r?.success);
        if (failed) {
          this.snackBar.open('Some rows could not be saved', 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('Customer prices saved', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        }
        this.saving = false;
      },
      error: () => {
        this.snackBar.open('Save failed', 'Close', { duration: 5000 });
        this.saving = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
