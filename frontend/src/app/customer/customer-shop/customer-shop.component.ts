import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ProductService, Product } from '../../core/services/product.service';
import { ShopProfileService } from '../../core/services/shop-profile.service';
import { CustomerOrderService, PlaceCustomerOrderRequest } from '../../core/services/customer-order.service';

interface CartLine {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-customer-shop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './customer-shop.component.html',
  styleUrls: ['./customer-shop.component.scss']
})
export class CustomerShopComponent implements OnInit {
  companyName = '';
  shopDisplayName = '';
  products: Product[] = [];
  cart: CartLine[] = [];
  loading = false;
  placing = false;
  paymentMode: 'CASH' | 'CREDIT' = 'CASH';
  discount = 0;

  constructor(
    public authService: AuthService,
    private productService: ProductService,
    private shopProfile: ShopProfileService,
    private orderService: CustomerOrderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const u = this.authService.getCurrentUser();
    this.companyName = u?.companyName || 'Shop';
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loading = true;
    this.shopProfile.getShopProfile().subscribe({
      next: (prof) => {
        if (prof.success && prof.data?.shopName) {
          this.shopDisplayName = prof.data.shopName;
        }
      },
      error: () => {
        /* optional */
      }
    });

    this.productService
      .getActiveProducts()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.products = res.data;
          }
        },
        error: () => {
          this.snackBar.open('Could not load products', 'Close', { duration: 3000 });
        }
      });
  }

  addToCart(p: Product): void {
    const id = p.id!;
    const line = this.cart.find((c) => c.product.id === id);
    if (line) {
      line.quantity += 1;
    } else {
      this.cart.push({ product: p, quantity: 1 });
    }
  }

  updateQty(line: CartLine, delta: number): void {
    line.quantity += delta;
    if (line.quantity <= 0) {
      this.cart = this.cart.filter((l) => l.product.id !== line.product.id);
    }
  }

  lineTotal(line: CartLine): number {
    const price = line.product.sellingPrice || 0;
    return Math.round(line.quantity * price * 100) / 100;
  }

  cartTotal(): number {
    return this.cart.reduce((sum, l) => sum + this.lineTotal(l), 0);
  }

  finalTotal(): number {
    const t = this.cartTotal();
    const d = this.discount || 0;
    return Math.max(0, Math.round((t - d) * 100) / 100);
  }

  placeOrder(): void {
    if (this.cart.length === 0) {
      this.snackBar.open('Add items to your cart first', 'Close', { duration: 2500 });
      return;
    }
    const body: PlaceCustomerOrderRequest = {
      items: this.cart.map((c) => ({
        productId: c.product.id!,
        quantity: c.quantity
      })),
      discount: this.discount || 0,
      paymentMode: this.paymentMode
    };
    this.placing = true;
    this.orderService.placeOrder(body).subscribe({
      next: (res) => {
        this.placing = false;
        if (res.success && res.data) {
          this.snackBar.open(
            `Order placed: ${res.data.orderNumber} — total ${this.finalTotal()}`,
            'Close',
            { duration: 5000 }
          );
          this.cart = [];
          this.discount = 0;
        } else {
          this.snackBar.open(res.message || 'Order failed', 'Close', { duration: 4000 });
        }
      },
      error: (err) => {
        this.placing = false;
        const msg = err?.error?.message || 'Could not place order';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
