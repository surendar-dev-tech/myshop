import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { timeout, finalize } from 'rxjs/operators';
import { SupplierService, Supplier } from '../core/services/supplier.service';
import { SupplierDialogComponent } from './supplier-dialog.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss']
})
export class SuppliersComponent implements OnInit {
  suppliersDataSource = new MatTableDataSource<Supplier>([]);
  /** The "active" status column is removed — only active suppliers are fetched. */
  displayedColumns: string[] = ['name', 'contactPerson', 'phone', 'email', 'actions'];
  isLoading = false;

  constructor(
    private supplierService: SupplierService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading = true;
    // Use active-only endpoint — inactive suppliers are never shown in the list.
    this.supplierService.getActiveSuppliers()
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.suppliersDataSource.data = response.data;
        } else {
          this.suppliersDataSource.data = [];
        }
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.showErrorMessage('Error loading suppliers. Please try again.');
        this.suppliersDataSource.data = [];
      }
    });
  }

  openAddSupplierDialog(): void {
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: null,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSuppliers();
      }
    });
  }

  openEditSupplierDialog(supplier: Supplier): void {
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: supplier,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Refresh from server to pick up any field changes (cache was already busted by the service).
        this.loadSuppliers();
      }
    });
  }

  deleteSupplier(supplierId: number): void {
    if (confirm('Are you sure you want to deactivate this supplier?')) {
      // Optimistic update: remove immediately from the table so there is no loading delay.
      this.suppliersDataSource.data = this.suppliersDataSource.data.filter(
        s => s.id !== supplierId
      );

      this.supplierService.deleteSupplier(supplierId).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessMessage('Supplier deactivated successfully');
          } else {
            // Rollback: reload from server if the API reported failure.
            this.showErrorMessage('Failed to deactivate supplier');
            this.loadSuppliers();
          }
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
          // Rollback: put the row back by reloading.
          this.showErrorMessage('Error deactivating supplier. Please try again.');
          this.loadSuppliers();
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
