import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { timeout, finalize } from 'rxjs/operators';
import { PurchaseService, PurchaseRequest, Purchase } from '../core/services/purchase.service';
import { SupplierService, Supplier } from '../core/services/supplier.service';
import { ProductService, Product } from '../core/services/product.service';
import { PurchaseDialogComponent } from './purchase-dialog.component';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatTooltipModule
  ],
  templateUrl: './purchases.component.html',
  styleUrls: ['./purchases.component.scss']
})
export class PurchasesComponent implements OnInit {
  purchasesDataSource = new MatTableDataSource<Purchase>([]);
  displayedColumns: string[] = ['purchaseNumber', 'supplier', 'purchaseDate', 'totalAmount', 'paymentStatus', 'actions'];
  isLoading = false;

  constructor(
    private purchaseService: PurchaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPurchases();
  }

  loadPurchases(): void {
    this.isLoading = true;
    this.purchaseService
      .getAllPurchases()
      .pipe(
        timeout({ first: 60000 }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.purchasesDataSource.data = response.data;
          } else {
            this.purchasesDataSource.data = [];
          }
        },
        error: (error) => {
          console.error('Error loading purchases:', error);
          const msg =
            error?.name === 'TimeoutError'
              ? 'Request timed out. Check that the API is reachable.'
              : 'Error loading purchases. Please try again.';
          this.showErrorMessage(msg);
          this.purchasesDataSource.data = [];
        }
      });
  }

  openAddPurchaseDialog(): void {
    const dialogRef = this.dialog.open(PurchaseDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      data: null,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPurchases();
      }
    });
  }

  viewPurchase(purchase: Purchase): void {
    const dialogRef = this.dialog.open(PurchaseDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      data: purchase,
      disableClose: false
    });
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
        return 'status-paid';
      case 'PARTIAL':
        return 'status-partial';
      case 'PENDING':
        return 'status-pending';
      default:
        return '';
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









