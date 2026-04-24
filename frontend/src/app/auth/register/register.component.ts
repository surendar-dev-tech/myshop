import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (password == null || confirm == null || password === '') {
    return null;
  }
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group(
      {
        companyName: ['', [Validators.required, Validators.maxLength(255)]],
        fullName: ['', Validators.required],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', Validators.email],
        phone: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordsMatch }
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.loading = true;
    const v = this.registerForm.value;
    const email = (v.email as string)?.trim();
    this.authService
      .register({
        companyName: (v.companyName as string).trim(),
        username: v.username.trim(),
        password: v.password,
        fullName: v.fullName.trim(),
        phone: v.phone.trim(),
        ...(email ? { email } : {})
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/dashboard']).finally(() => {
              this.loading = false;
            });
          } else {
            this.snackBar.open(response.message || 'Registration failed', 'Close', { duration: 4000 });
            this.loading = false;
          }
        },
        error: (err: HttpErrorResponse) => {
          const msg =
            err.error?.message ||
            (typeof err.error === 'string' ? err.error : null) ||
            'Could not create account. Please try again.';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
          this.loading = false;
        }
      });
  }
}
