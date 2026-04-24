import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Blocks CUSTOMER accounts from the staff console; sends them to the shop. */
export const staffGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  if (authService.hasRole('CUSTOMER')) {
    router.navigate(['/customer/shop']);
    return false;
  }
  return true;
};
