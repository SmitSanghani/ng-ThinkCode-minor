import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, take, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Sync check
    if (authService.isAuthenticated()) {
        return true;
    }

    // 2. Async check
    return authService.checkDetails().pipe(
        take(1),
        map(isAuthenticated => {
            if (isAuthenticated) {
                return true;
            }
            return router.createUrlTree(['/login']);
        })
    );
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        return authService.checkDetails().pipe(
            take(1),
            map(isAuthenticated => {
                const user = authService.currentUser();
                if (isAuthenticated && user && allowedRoles.includes(user.role)) {
                    return true;
                }
                return false;
            }),
            tap(isAuthorized => {
                if (!isAuthorized) {
                    router.navigate(['/login']); // Or authorized page
                }
            })
        );
    };
};

export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.checkDetails().pipe(
        take(1),
        map(isAuthenticated => {
            if (!isAuthenticated) {
                return true;
            }
            // If already logged in, redirect to home or dashboard based on role
            const user = authService.currentUser();
            if (user?.role === 'admin') {
                return router.createUrlTree(['/admin/dashboard']);
            }
            return router.createUrlTree(['/student/problems']);
        })
    );
};
