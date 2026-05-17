import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
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
  isSalesPage = false;
  currentUser: any;
  isAdmin = false;
  /** Categories: same as products page — admin and staff can manage */
  canManageCategories = false;
  unseenOnlineOrders = 0;

  private routerSub!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private customerOrderService: CustomerOrderService
  ) {
    this.currentUser = authService.getCurrentUser();
    this.isAdmin = authService.hasRole('ADMIN');
    this.canManageCategories =
      this.isAdmin || this.authService.hasRole('STAFF');

    this.isSalesPage = this.router.url.includes('/sales');
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isSalesPage = event.urlAfterRedirects.includes('/sales');
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
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

