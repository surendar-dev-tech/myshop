import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomerService, Customer } from '../core/services/customer.service';

@Component({
  selector: 'app-customer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './customer-dialog.component.html',
  styleUrls: ['./customer-dialog.component.scss']
})
export class CustomerDialogComponent implements OnInit {
  customerForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public customerData: Customer | null,
    private customerService: CustomerService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = !!customerData;
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.customerData) {
      this.populateFormWithCustomerData();
    }
  }

  private initializeForm(): void {
    this.customerForm = this.formBuilder.group({
      customerName: ['', [Validators.required]],
      phoneNumber: [''],
      email: ['', [Validators.email]],
      address: [''],
      active: [true]
    });
  }

  private populateFormWithCustomerData(): void {
    if (this.customerData) {
      this.customerForm.patchValue({
        customerName: this.customerData.name,
        phoneNumber: this.customerData.phone || '',
        email: this.customerData.email || '',
        address: this.customerData.address || '',
        active: this.customerData.active !== false
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.customerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.customerForm.value;

    const customerPayload: Customer = {
      name: formValue.customerName,
      phone: formValue.phoneNumber || null,
      email: formValue.email || null,
      address: formValue.address || null,
      active: formValue.active !== false
    };

    if (this.isEditMode && this.customerData?.id) {
      this.updateCustomer(this.customerData.id, customerPayload);
    } else {
      this.createCustomer(customerPayload);
    }
  }

  private createCustomer(customerPayload: Customer): void {
    this.customerService.createCustomer(customerPayload).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Customer created successfully');
          this.dialogRef.close(true);
        } else {
          this.showErrorMessage('Failed to create customer');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error creating customer', error);
        this.isLoading = false;
      }
    });
  }

  private updateCustomer(customerId: number, customerPayload: Customer): void {
    this.customerService.updateCustomer(customerId, customerPayload).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Customer updated successfully');
          this.dialogRef.close(true);
        } else {
          this.showErrorMessage('Failed to update customer');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error updating customer', error);
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.customerForm.controls).forEach(key => {
      const control = this.customerForm.get(key);
      control?.markAsTouched();
    });
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

  private handleError(operation: string, error: any): void {
    const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
    this.showErrorMessage(`${operation}: ${errorMessage}`);
    console.error(`${operation}:`, error);
  }
}
