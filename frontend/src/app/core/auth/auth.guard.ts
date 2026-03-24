import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '@shared/models/user.model';

export const authGuard: CanActivateFn = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (): boolean => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const role = authService.userRole();
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    router.navigate(['/login']);
    return false;
  };
};
