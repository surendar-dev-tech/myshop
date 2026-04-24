import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import {
  CustomerOrderService,
  CustomerOrderDto
} from '../core/services/customer-order.service';
import { SalePrefillFromOrderService } from '../core/services/sale-prefill-from-order.service';

@Component({
  selector: 'app-online-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './online-orders.component.html',
  styleUrls: ['./online-orders.component.scss']
})
export class OnlineOrdersComponent implements OnInit {
  loading = false;
  orders: CustomerOrderDto[] = [];

  constructor(
    private customerOrderService: CustomerOrderService,
    private snackBar: MatSnackBar,
    private router: Router,
    private salePrefill: SalePrefillFromOrderService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.customerOrderService
      .listOrders()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.orders = res.data;
          }
        },
        error: () => {
          this.snackBar.open('Could not load online orders', 'Close', { duration: 3000 });
        }
      });
  }

  acknowledge(o: CustomerOrderDto): void {
    this.customerOrderService.markSeen(o.id).subscribe({
      next: (res) => {
        if (res.success) {
          o.seenByCompany = true;
        }
      },
      error: () => {
        this.snackBar.open('Could not update order', 'Close', { duration: 3000 });
      }
    });
  }

  /** Opens Point of Sale with lines, customer, discount, and payment pre-filled. Complete sale there to create the invoice and link this order. */
  openInPos(o: CustomerOrderDto): void {
    if (o.status !== 'PENDING' || o.convertedSaleId) {
      return;
    }
    this.salePrefill.setFromOrder(o);
    this.router.navigate(['/sales']);
  }
}
