import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Customer, CustomerService } from '../core/services/customer.service';

export interface CustomerPortalDialogData {
  customer: Customer;
}

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password')?.value;
  const c = control.get('confirmPassword')?.value;
  if (pw && c && pw !== c) {
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-customer-portal-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './customer-portal-dialog.component.html',
  styleUrls: ['./customer-portal-dialog.component.scss']
})
export class CustomerPortalDialogComponent {
  createForm: FormGroup;
  resetForm: FormGroup;
  busy = false;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CustomerPortalDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: CustomerPortalDialogData
  ) {
    this.createForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordsMatch }
    );

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    });
  }

  get customer(): Customer {
    return this.data.customer;
  }

  get hasPortal(): boolean {
    return !!this.customer.onlineOrderingEnabled;
  }

  createSubmit(): void {
    if (this.createForm.invalid) {
      return;
    }
    const v = this.createForm.value;
    this.busy = true;
    this.customerService
      .createPortalAccount(this.customer.id!, {
        username: v.username.trim(),
        password: v.password
      })
      .subscribe({
        next: (res) => {
          this.busy = false;
          if (res.success) {
            this.snackBar.open(res.message || 'Online access created', 'Close', { duration: 5000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(res.message || 'Failed', 'Close', { duration: 4000 });
          }
        },
        error: (err) => {
          this.busy = false;
          this.snackBar.open(err?.error?.message || 'Could not create access', 'Close', { duration: 5000 });
        }
      });
  }

  resetSubmit(): void {
    const np = this.resetForm.get('newPassword')?.value;
    const cn = this.resetForm.get('confirmNewPassword')?.value;
    if (np !== cn) {
      this.snackBar.open('Passwords do not match', 'Close', { duration: 3000 });
      return;
    }
    if (this.resetForm.get('newPassword')?.invalid) {
      return;
    }
    this.busy = true;
    this.customerService.resetPortalPassword(this.customer.id!, np).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) {
          this.snackBar.open('Password updated', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Failed', 'Close', { duration: 4000 });
        }
      },
      error: (err) => {
        this.busy = false;
        this.snackBar.open(err?.error?.message || 'Could not reset password', 'Close', { duration: 5000 });
      }
    });
  }

  revoke(): void {
    if (!confirm('Remove online ordering access for this customer? They will not be able to log in until you create new access.')) {
      return;
    }
    this.busy = true;
    this.customerService.revokePortalAccount(this.customer.id!).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) {
          this.snackBar.open('Access removed', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Failed', 'Close', { duration: 4000 });
        }
      },
      error: (err) => {
        this.busy = false;
        this.snackBar.open(err?.error?.message || 'Could not remove access', 'Close', { duration: 5000 });
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
