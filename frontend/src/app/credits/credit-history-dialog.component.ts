import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/auth.model';

export interface CreditHistoryDialogData {
  customerId: number;
  customerName: string;
}

export interface CreditTransaction {
  id: number;
  amount: number;
  transactionType: 'CREDIT_ADDED' | 'CREDIT_PAID';
  dueDate?: string;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  sale?: {
    id: number;
    invoiceNumber: string;
  };
}

@Component({
  selector: 'app-credit-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './credit-history-dialog.component.html',
  styleUrls: ['./credit-history-dialog.component.scss']
})
export class CreditHistoryDialogComponent implements OnInit {
  historyDataSource = new MatTableDataSource<CreditTransaction>([]);
  displayedColumns: string[] = ['date', 'type', 'amount', 'dueDate', 'paymentDate', 'notes', 'invoice'];
  isLoading = false;
  totalCredit = 0;
  totalPaid = 0;
  outstandingBalance = 0;

  constructor(
    private dialogRef: MatDialogRef<CreditHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreditHistoryDialogData,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCreditHistory();
  }

  loadCreditHistory(): void {
    this.isLoading = true;
    this.httpClient.get<ApiResponse<CreditTransaction[]>>(
      `${environment.apiUrl}/credits/${this.data.customerId}/history`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.historyDataSource.data = response.data;
          this.calculateTotals(response.data);
        } else {
          this.historyDataSource.data = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading credit history:', error);
        this.historyDataSource.data = [];
        this.isLoading = false;
      }
    });
  }

  calculateTotals(transactions: CreditTransaction[]): void {
    this.totalCredit = transactions
      .filter(t => t.transactionType === 'CREDIT_ADDED')
      .reduce((sum, t) => sum + t.amount, 0);
    
    this.totalPaid = transactions
      .filter(t => t.transactionType === 'CREDIT_PAID')
      .reduce((sum, t) => sum + t.amount, 0);
    
    this.outstandingBalance = this.totalCredit - this.totalPaid;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

