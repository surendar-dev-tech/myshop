import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/auth.model';

export interface OutstandingCustomerRow {
  customerId: number;
  customerName: string;
  customerPhone?: string;
  outstandingBalance: number;
}

/** Optional: opened from Invoices row to pre-select customer and current balance. */
export interface AccountPaymentPrefill {
  customerId: number;
  customerName?: string;
}

@Component({
  selector: 'app-account-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './account-payment-dialog.component.html',
  styleUrls: ['./account-payment-dialog.component.scss']
})
export class AccountPaymentDialogComponent implements OnInit {
  paymentForm!: FormGroup;
  isLoading = false;
  loadingCustomers = true;
  customers: OutstandingCustomerRow[] = [];
  selectedCustomer: OutstandingCustomerRow | null = null;
  /** When opened from an invoice row — customer is fixed. */
  prefillMode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AccountPaymentDialogComponent>,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar,
    @Optional() @Inject(MAT_DIALOG_DATA) public prefill: AccountPaymentPrefill | null
  ) {}

  ngOnInit(): void {
    this.paymentForm = this.fb.group({
      customerId: [null, Validators.required],
      amount: [{ value: null, disabled: true }, []],
      notes: ['']
    });
    if (this.prefill?.customerId != null) {
      this.prefillMode = true;
      this.loadPrefillCustomer(this.prefill.customerId, this.prefill.customerName);
    } else {
      this.loadOutstandingCustomers();
    }
  }

  private loadPrefillCustomer(customerId: number, name?: string): void {
    this.loadingCustomers = true;
    this.httpClient.get<ApiResponse<number>>(`${environment.apiUrl}/credits/${customerId}/balance`).subscribe({
      next: (response) => {
        this.loadingCustomers = false;
        const bal = response.success && response.data != null ? Number(response.data) : 0;
        this.customers = [
          {
            customerId,
            customerName: name?.trim() || 'Customer',
            outstandingBalance: bal
          }
        ];
        this.paymentForm.patchValue({ customerId });
        this.onCustomerChange();
        if (bal <= 0) {
          this.snackBar.open('No outstanding balance for this customer.', 'Close', { duration: 4000 });
        }
      },
      error: () => {
        this.loadingCustomers = false;
        this.snackBar.open('Could not load customer balance', 'Close', { duration: 5000 });
      }
    });
  }

  private loadOutstandingCustomers(): void {
    this.loadingCustomers = true;
    this.httpClient.get<ApiResponse<OutstandingCustomerRow[]>>(`${environment.apiUrl}/credits/outstanding`).subscribe({
      next: (response) => {
        this.loadingCustomers = false;
        if (response.success && response.data?.length) {
          this.customers = response.data
            .filter((c) => Number(c.outstandingBalance) > 0)
            .sort((a, b) => a.customerName.localeCompare(b.customerName));
        } else {
          this.customers = [];
        }
      },
      error: () => {
        this.loadingCustomers = false;
        this.snackBar.open('Could not load customers with outstanding balance', 'Close', { duration: 5000 });
      }
    });
  }

  onCustomerChange(): void {
    const id = this.paymentForm.get('customerId')?.value as number | null;
    this.selectedCustomer = this.customers.find((c) => c.customerId === id) || null;
    const amtCtrl = this.paymentForm.get('amount');
    if (!this.selectedCustomer) {
      amtCtrl?.disable();
      amtCtrl?.clearValidators();
      amtCtrl?.setValue(null);
      amtCtrl?.updateValueAndValidity();
      return;
    }
    const bal = Number(this.selectedCustomer.outstandingBalance);
    amtCtrl?.enable();
    amtCtrl?.setValidators([Validators.required, Validators.min(0.01), Validators.max(bal)]);
    amtCtrl?.setValue(bal);
    amtCtrl?.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onRecordPayment(): void {
    if (this.paymentForm.invalid || !this.selectedCustomer) {
      return;
    }
    this.isLoading = true;
    const raw = this.paymentForm.getRawValue();
    const amount = raw.amount;
    const notes = raw.notes?.trim();

    let params = new HttpParams().set('amount', String(amount));
    if (notes) {
      params = params.set('notes', notes);
    }

    this.httpClient
      .post<ApiResponse<unknown>>(`${environment.apiUrl}/credits/${this.selectedCustomer.customerId}/pay`, null, {
        params
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.snackBar.open('Payment recorded successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(response.message || 'Failed to record payment', 'Close', { duration: 5000 });
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(
            'Error: ' + (error.error?.message || error.message || 'Unknown error'),
            'Close',
            { duration: 5000 }
          );
        }
      });
  }
}
