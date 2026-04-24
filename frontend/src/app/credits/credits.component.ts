import { Component, OnInit } from '@angular/core';
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

  constructor(
    private httpClient: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOutstandingCredits();
  }

  loadOutstandingCredits(): void {
    this.isLoading = true;
    this.httpClient.get<ApiResponse<OutstandingCredit[]>>(`${environment.apiUrl}/credits/outstanding`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.creditsDataSource.data = response.data
            .slice()
            .sort((a, b) => a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' }));
        } else {
          this.creditsDataSource.data = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading outstanding credits:', error);
        this.showErrorMessage('Error loading outstanding credits. Please try again.');
        this.creditsDataSource.data = [];
        this.isLoading = false;
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
