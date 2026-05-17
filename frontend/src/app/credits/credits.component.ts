import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { timeout, finalize } from 'rxjs/operators';
import { ApiResponse } from '../core/models/auth.model';
import { CreditHistoryDialogComponent } from './credit-history-dialog.component';

export interface OutstandingCredit {
  customerId: number;
  customerName: string;
  customerPhone?: string;
  outstandingBalance: number;
}

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.scss']
})
export class CreditsComponent implements OnInit {
  creditsDataSource = new MatTableDataSource<OutstandingCredit>([]);
  displayedColumns: string[] = ['customerName', 'phone', 'outstandingBalance', 'actions'];

  get totalOutstanding(): number {
    return this.creditsDataSource.data.reduce((sum, row) => sum + (Number(row.outstandingBalance) || 0), 0);
  }
  isLoading = false;

  /** Simple 30s in-memory cache for the credits list. */
  private creditsCache: { data: OutstandingCredit[]; expiresAt: number } | null = null;

  constructor(
    private httpClient: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOutstandingCredits();
  }

  loadOutstandingCredits(): void {
    // Serve from cache if still fresh.
    if (this.creditsCache && this.creditsCache.expiresAt > Date.now()) {
      this.creditsDataSource.data = this.creditsCache.data;
      return;
    }
    this.isLoading = true;
    this.httpClient.get<ApiResponse<OutstandingCredit[]>>(`${environment.apiUrl}/credits/outstanding`)
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
          const sorted = response.data
            .slice()
            .sort((a, b) => a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' }));
          this.creditsDataSource.data = sorted;
          this.creditsCache = { data: sorted, expiresAt: Date.now() + 30_000 };
        } else {
          this.creditsDataSource.data = [];
        }
      },
      error: (error) => {
        console.error('Error loading outstanding credits:', error);
        this.showErrorMessage('Error loading outstanding credits. Please try again.');
        this.creditsDataSource.data = [];
      }
    });
  }

  viewHistory(customerId: number): void {
    const credit = this.creditsDataSource.data.find(c => c.customerId === customerId);
    if (!credit) return;

    this.dialog.open(CreditHistoryDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        customerId: credit.customerId,
        customerName: credit.customerName
      }
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
