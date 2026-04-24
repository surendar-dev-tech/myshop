import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Only CUSTOMER role (online ordering). */
export const customerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  if (!authService.hasRole('CUSTOMER')) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
