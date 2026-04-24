import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomerService, Customer } from '../core/services/customer.service';
import { AuthService } from '../core/services/auth.service';
import { CustomerDialogComponent } from './customer-dialog.component';
import { CustomerPortalDialogComponent } from './customer-portal-dialog.component';
import { CustomerSpecialPricesDialogComponent } from './customer-special-prices-dialog.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  customersDataSource = new MatTableDataSource<Customer>([]);
  displayedColumns: string[] = ['name', 'phone', 'email', 'outstandingBalance', 'onlineOrdering', 'actions'];
  isLoading = false;
  isAdmin = false;

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ADMIN');
    this.loadCustomers();
  }

  openSpecialPricesDialog(customer: Customer): void {
    if (!this.isAdmin || customer.id == null) {
      return;
    }
    this.dialog
      .open(CustomerSpecialPricesDialogComponent, {
        width: '800px',
        maxWidth: '96vw',
        maxHeight: '90vh',
        data: { customer },
        disableClose: true
      })
      .afterClosed()
      .subscribe(() => {});
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customersDataSource.data = response.data;
        } else {
          this.customersDataSource.data = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.showErrorMessage('Error loading customers. Please try again.');
        this.customersDataSource.data = [];
        this.isLoading = false;
      }
    });
  }

  openAddCustomerDialog(): void {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: null,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCustomers();
      }
    });
  }

  openEditCustomerDialog(customer: Customer): void {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: customer,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCustomers();
      }
    });
  }

  openPortalDialog(customer: Customer): void {
    const dialogRef = this.dialog.open(CustomerPortalDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: { customer },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((changed) => {
      if (changed) {
        this.loadCustomers();
      }
    });
  }

  deleteCustomer(customerId: number): void {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      this.customerService.deleteCustomer(customerId).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessMessage('Customer deleted successfully');
            this.loadCustomers();
          } else {
            this.showErrorMessage('Failed to delete customer');
          }
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.showErrorMessage('Error deleting customer. Please try again.');
        }
      });
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }
}
