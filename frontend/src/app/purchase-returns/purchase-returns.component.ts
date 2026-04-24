import { Component, OnInit } from '@angular/core';
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
import { PurchaseReturnService, PurchaseReturn } from '../core/services/purchase-return.service';
import { PurchaseReturnDialogComponent } from './purchase-return-dialog.component';

@Component({
  selector: 'app-purchase-returns',
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
  templateUrl: './purchase-returns.component.html',
  styleUrls: ['../purchases/purchases.component.scss']
})
export class PurchaseReturnsComponent implements OnInit {
  dataSource = new MatTableDataSource<PurchaseReturn>([]);
  displayedColumns: string[] = ['returnNumber', 'returnDate', 'finalAmount', 'actions'];
  isLoading = false;

  constructor(
    private purchaseReturnService: PurchaseReturnService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.purchaseReturnService
      .getAll()
      .pipe(
        timeout({ first: 60000 }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.dataSource.data = response.data;
          } else {
            this.dataSource.data = [];
          }
        },
        error: (error) => {
          console.error(error);
          const msg =
            error?.name === 'TimeoutError'
              ? 'Request timed out.'
              : 'Could not load purchase returns.';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
          this.dataSource.data = [];
        }
      });
  }

  openCreate(): void {
    const ref = this.dialog.open(PurchaseReturnDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      data: null,
      disableClose: true
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.load();
      }
    });
  }

  view(row: PurchaseReturn): void {
    this.purchaseReturnService.getById(row.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dialog.open(PurchaseReturnDialogComponent, {
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '95vh',
            data: res.data,
            disableClose: false
          });
        }
      },
      error: () => this.snackBar.open('Could not load details', 'Close', { duration: 4000 })
    });
  }
}
