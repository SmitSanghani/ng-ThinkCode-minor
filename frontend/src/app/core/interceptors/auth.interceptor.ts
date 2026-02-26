import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.token;

    const isPublicRoute = req.url.includes('login') || req.url.includes('register') || req.url.includes('refresh-token');

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    } else if (!isPublicRoute) {
        console.warn('AuthInterceptor: No token found for request:', req.url);
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.includes('login') && !req.url.includes('refresh-token')) {
                // Attempt refresh
                return authService.refreshToken().pipe(
                    switchMap((response) => {
                        // Retry request with new token
                        if (response.accessToken) {
                            req = req.clone({
                                setHeaders: { Authorization: `Bearer ${response.accessToken}` }
                            });
                            return next(req);
                        }
                        return throwError(() => error);
                    }),
                    catchError((refreshErr) => {
                        // Refresh failed, logout
                        authService.logout();
                        return throwError(() => refreshErr);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
