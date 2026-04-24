import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../core/services/auth.service';
import { CustomerOrderService } from '../core/services/customer-order.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  currentUser: any;
  isAdmin = false;
  /** Categories: same as products page — admin and staff can manage */
  canManageCategories = false;
  unseenOnlineOrders = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private customerOrderService: CustomerOrderService
  ) {
    this.currentUser = authService.getCurrentUser();
    this.isAdmin = authService.hasRole('ADMIN');
    this.canManageCategories =
      this.isAdmin || this.authService.hasRole('STAFF');
  }

  ngOnInit(): void {
    this.customerOrderService.getUnseenCount().subscribe({
      next: (res) => {
        if (res.success && res.data != null) {
          this.unseenOnlineOrders = res.data;
        }
      },
      error: () => {
        this.unseenOnlineOrders = 0;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /** Short label for toolbar (Admin / Staff) */
  get roleToolbarLabel(): string {
    const r = this.currentUser?.role;
    if (r === 'ADMIN') {
      return 'Admin';
    }
    if (r === 'STAFF') {
      return 'Staff';
    }
    return r ? String(r) : '';
  }
}

