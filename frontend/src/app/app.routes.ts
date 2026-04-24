import { Routes } from '@angular/router';
import { staffGuard } from './core/guards/staff.guard';
import { customerGuard } from './core/guards/customer.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'customer/shop',
    canActivate: [customerGuard],
    loadComponent: () =>
      import('./customer/customer-shop/customer-shop.component').then(m => m.CustomerShopComponent)
  },
  {
    path: '',
    canActivate: [staffGuard],
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'online-orders',
        loadComponent: () =>
          import('./online-orders/online-orders.component').then(m => m.OnlineOrdersComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./sales/sales.component').then(m => m.SalesComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./invoices/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./customers/customers.component').then(m => m.CustomersComponent)
      },
      {
        path: 'credits',
        loadComponent: () => import('./credits/credits.component').then(m => m.CreditsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./suppliers/suppliers.component').then(m => m.SuppliersComponent)
      },
      {
        path: 'purchases',
        loadComponent: () => import('./purchases/purchases.component').then(m => m.PurchasesComponent)
      },
      {
        path: 'purchase-returns',
        loadComponent: () =>
          import('./purchase-returns/purchase-returns.component').then(m => m.PurchaseReturnsComponent)
      },
      {
        path: 'sales-returns',
        loadComponent: () =>
          import('./sales-returns/sales-returns.component').then(m => m.SalesReturnsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'employees',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./employees/employees.component').then(m => m.EmployeesComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

