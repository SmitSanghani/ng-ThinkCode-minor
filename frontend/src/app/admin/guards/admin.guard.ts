import { inject } from '@angular/core';
import {
    CanActivateFn,
    Router
} from '@angular/router';
import { AuthService } from '../../core/services/auth.service'; // Adjust path if needed
import { map, take, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const AdminGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    // 1. Check if we already have the state (from APP_INITIALIZER)
    if (authService.isAuthenticated()) {
        const user = authService.currentUser();
        if (user?.role === 'admin') {
            return true;
        }
        return router.createUrlTree(['/login']);
    }

    // 2. Fallback: If for some reason state is not there (e.g. deep link without init?), try to restore
    return authService.checkDetails().pipe(
        take(1),
        map(isAuthenticated => {
            const user = authService.currentUser();
            if (isAuthenticated && user?.role === 'admin') {
                return true;
            }
            return router.createUrlTree(['/login']);
        })
    );
};
