import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ShopUser, UserService } from '../core/services/user.service';

@Component({
  selector: 'app-employee-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.scss']
})
export class EmployeeDialogComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isEditMode = false;
  private initialActive = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public userData: ShopUser | null,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = !!userData;
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.userData) {
      this.initialActive = this.userData.active !== false;
      this.form.patchValue({
        username: this.userData.username,
        fullName: this.userData.fullName,
        email: this.userData.email || '',
        phone: this.userData.phone,
        active: this.initialActive,
        newPassword: ''
      });
      this.form.get('username')?.disable();
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.required]],
      active: [true],
      newPassword: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (this.isEditMode && this.userData?.id != null) {
      const pwd = (raw.newPassword || '').trim();
      if (pwd.length > 0 && pwd.length < 6) {
        this.showErrorMessage('New password must be at least 6 characters');
        return;
      }
      this.saveEdit(this.userData.id, raw, pwd);
      return;
    }

    this.isLoading = true;
    this.userService
      .createUser({
        username: raw.username.trim(),
        password: raw.password,
        fullName: raw.fullName.trim(),
        email: (raw.email || '').trim() || undefined,
        phone: raw.phone.trim()
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessMessage('Employee created. They can sign in with their username and password.');
            this.dialogRef.close(true);
          } else {
            this.showErrorMessage(response.message || 'Could not create employee');
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.handleHttpError('Could not create employee', error);
          this.isLoading = false;
        }
      });
  }

  private saveEdit(
    id: number,
    raw: {
      fullName: string;
      email: string;
      phone: string;
      active: boolean;
    },
    newPassword: string
  ): void {
    this.isLoading = true;
    const body = {
      fullName: raw.fullName.trim(),
      email: (raw.email || '').trim() || undefined,
      phone: raw.phone.trim()
    };

    this.userService
      .updateUser(id, body)
      .pipe(
        switchMap((res) => {
          if (!res.success) {
            return throwError(() => new Error(res.message || 'Update failed'));
          }
          if (raw.active !== this.initialActive) {
            return this.userService.setActive(id, raw.active);
          }
          return of({ success: true } as const);
        }),
        switchMap((res) => {
          if (!res.success) {
            return throwError(() => new Error(res.message || 'Could not update status'));
          }
          if (newPassword.length >= 6) {
            return this.userService.resetPassword(id, newPassword);
          }
          return of({ success: true } as const);
        })
      )
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.showErrorMessage(res.message || 'Save failed');
            this.isLoading = false;
            return;
          }
          this.showSuccessMessage('Employee updated');
          this.dialogRef.close(true);
          this.isLoading = false;
        },
        error: (error: unknown) => {
          const msg =
            (error as any)?.error?.message ||
            (error instanceof Error ? error.message : null) ||
            'Could not save';
          this.showErrorMessage(msg);
          console.error(error);
          this.isLoading = false;
        }
      });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3500,
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

  private handleHttpError(prefix: string, error: any): void {
    const msg = error?.error?.message || error?.message || 'Unknown error';
    this.showErrorMessage(`${prefix}: ${msg}`);
    console.error(prefix, error);
  }
}
